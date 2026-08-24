/**
 * @file CashMemoDesigner.jsx
 * @description Advanced Cash Memo & Invoice Designer with custom paper sizing, rich dropdown selectors, live interactive preview with zoom controls, watermark options, barcodes, QR codes, and instant test printing.
 */
import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { printSaleReceipt } from '@/utils/invoicePrinter';
import CustomSelect from '@/components/ui/CustomSelect';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  FileText, Printer, Palette, Sliders, Check, Layout,
  Eye, RefreshCw, Sparkles, Building2, Phone, MapPin,
  QrCode, Stamp, ShieldCheck, ShoppingCart, HelpCircle,
  Layers, CheckCircle2, ChevronRight, SlidersHorizontal,
  Maximize2, ZoomIn, ZoomOut, Barcode, DollarSign,
  Percent, Clock, Tag, MessageSquare, ShieldAlert
} from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#00a86b' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Crimson', hex: '#e11d48' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Charcoal', hex: '#18181b' },
];

const TEMPLATES = [
  {
    id: 'modern',
    nameEn: 'Modern Minimalist',
    nameBn: 'মডার্ন মিনিমালিস্ট',
    descEn: 'Clean borderless layout with soft accent badges and prominent shop branding.',
    descBn: 'আধুনিক ও মার্জিত লুক, কালার অ্যাকসেন্ট এবং স্মার্ট ব্যাজ সহ।',
  },
  {
    id: 'classic',
    nameEn: 'Classic Retail Receipt',
    nameBn: 'ক্লাসিক রিটেল মেমো',
    descEn: 'Traditional box-bordered cash memo with formal customer header and seal box.',
    descBn: 'ঐতিহ্যবাহী ফ্রেমযুক্ত ক্যাশ মেমো, সিল ও স্বাক্ষর বক্স সহ।',
  },
  {
    id: 'thermal',
    nameEn: 'Thermal High-Contrast',
    nameBn: 'থার্মাল হাই-কনট্রাস্ট',
    descEn: 'Monospaced high-contrast design optimized for 80mm & 58mm POS thermal printers.',
    descBn: 'থার্মাল পিওএস প্রিন্টারের জন্য সর্বোচ্চ স্পষ্ট ও দ্রুত প্রিন্টযোগ্য ডিজাইন।',
  },
  {
    id: 'bold',
    nameEn: 'Bold Header Banner',
    nameBn: 'বোল্ড হেডার ব্যানার',
    descEn: 'Prominent solid color top banner with inverted typography and clean line items.',
    descBn: 'রঙিন হেডার ব্যানার এবং হাইলাইট করা টোটাল বিল সেকশন।',
  },
  {
    id: 'a4',
    nameEn: 'Standard Sheet (A4/A5)',
    nameBn: 'স্ট্যান্ডার্ড ইনভয়েস (A4/A5)',
    descEn: 'Full-width delivery memo with detailed columns, unit prices, and authorized sign.',
    descBn: 'হোলসেল ও হোম ডেলিভারির জন্য পূর্ণাঙ্গ বড় সাইজ ইনভয়েস।',
  },
];

export default function CashMemoDesigner({ memoConfig, setMemoConfig, shop, form, setForm }) {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const [previewZoom, setPreviewZoom] = useState(100); // 80, 100, 120

  // Dropdown Options
  const paperFormatOptions = [
    { value: '80mm', label: '80mm POS Thermal (Standard Retail)', sublabel: 'Standard retail receipt roll (76-80mm)', badge: 'Most Popular' },
    { value: '58mm', label: '58mm Mini POS Thermal', sublabel: 'Compact handheld mobile Bluetooth printers' },
    { value: 'A4', label: 'A4 Full Page Commercial Sheet', sublabel: 'Standard letter size for invoices & delivery' },
    { value: 'A5', label: 'A5 Half Page Cash Voucher', sublabel: 'Compact standard half-page pad format' },
    { value: 'custom', label: '⚙️ Custom Dimensions (mm)', sublabel: 'Specify custom roll or sheet width in millimeters', badge: 'Custom' },
  ];

  const fontSizeOptions = [
    { value: 'compact', label: isBn ? 'কমপ্যাক্ট (ছোট ও কাগজ সাশ্রয়ী)' : 'Compact (9.5px - Paper Saver)', sublabel: 'High density text for short receipts' },
    { value: 'standard', label: isBn ? 'স্ট্যান্ডার্ড (ভারসাম্যপূর্ণ)' : 'Standard (11px - Balanced)', sublabel: 'Recommended readability for all printers', badge: 'Default' },
    { value: 'large', label: isBn ? 'বড় ফন্ট (সহজে পাঠযোগ্য)' : 'Large (12.5px - Easy Read)', sublabel: 'High visibility for elderly & delivery' },
  ];

  const spacingDensityOptions = [
    { value: 'tight', label: isBn ? 'টাইট / টাইট স্পেসিং' : 'Tight Padding (Compact)', sublabel: 'Minimal row gaps to save paper length' },
    { value: 'normal', label: isBn ? 'স্বাভাবিক / স্ট্যান্ডার্ড' : 'Normal Padding (Balanced)', sublabel: 'Standard padding between items' },
    { value: 'relaxed', label: isBn ? 'খোলামেলা / রিলাক্সড' : 'Relaxed Padding (Spacious)', sublabel: 'Generous line height and margins' },
  ];

  const watermarkOptions = [
    { value: 'none', label: isBn ? 'কোনো ওয়াটারমার্ক নেই' : 'None (No Watermark)' },
    { value: 'paid', label: isBn ? 'পরিশোধিত (PAID)' : 'PAID Watermark', badge: 'Popular' },
    { value: 'original', label: isBn ? 'অরিজিনাল কপি (ORIGINAL)' : 'ORIGINAL COPY' },
    { value: 'custom', label: isBn ? 'কাস্টম টেক্সট ওয়াটারমার্ক' : 'Custom Watermark Text' },
  ];

  const qrCodeOptions = [
    { value: 'invoice', label: isBn ? 'ডিজিটাল রসিদ যাচাই লিংক' : 'Digital Invoice Verification URL' },
    { value: 'bkash', label: isBn ? 'বিকাশ মার্চেন্ট পেমেন্ট লিংক' : 'bKash Merchant Pay QR' },
    { value: 'website', label: isBn ? 'দোকানের ওয়েবসাইট লিংক' : 'Store Website URL' },
  ];

  const paymentMethodOptions = [
    { value: 'Cash', label: 'Cash (নগদ)' },
    { value: 'bKash', label: 'bKash (বিকাশ)' },
    { value: 'Nagad', label: 'Nagad (নগদ)' },
    { value: 'Rocket', label: 'Rocket (রকেট)' },
    { value: 'Card', label: 'Credit/Debit Card (কার্ড)' },
    { value: 'Bank Transfer', label: 'Bank Transfer (ব্যাংক)' },
  ];

  // Sample Mock Order for Live Interactive Preview
  const sampleOrder = useMemo(() => ({
    id: 'INV-2026-8492',
    invoice_number: 'INV-2026-8492',
    created_at: new Date().toISOString(),
    created_by: { name: 'Kazi Farhan' },
    payment_method: form?.default_payment_method || 'CASH',
    customer_id: {
      name: isBn ? 'তানভীর আহমেদ' : 'Tanvir Ahmed',
      phone: '01712-345678',
      address: isBn ? 'মিরপুর-১০, ঢাকা' : 'Mirpur-10, Dhaka',
      is_member: true,
      membership_tier: 'Gold VIP',
      total_due: 450,
    },
    items: [
      {
        name: isBn ? 'প্রিমিয়াম মিনিকেট চাল (৫ কেজি)' : 'Premium Miniket Rice (5kg)',
        variant_name: isBn ? 'সিলভার ব্যাগ' : 'Silver Bag',
        sku: 'RICE-MIN-05',
        unit: 'kg',
        unit_price: 360,
        quantity: 1,
        subtotal: 360,
      },
      {
        name: isBn ? 'ফার্ম ফ্রেশ তরল দুধ (১ লিটার)' : 'Farm Fresh Pure Milk (1L)',
        variant_name: '',
        sku: 'MILK-FF-01',
        unit: 'ltr',
        unit_price: 95,
        quantity: 2,
        subtotal: 190,
      },
      {
        name: isBn ? 'ডার্ক চকোলেট ওয়েফার বার' : 'Dark Chocolate Wafer Bar',
        variant_name: isBn ? 'চকো ক্রাঞ্চ' : 'Choco Crunch',
        sku: 'WAF-DC-40G',
        unit: 'pcs',
        unit_price: 50,
        quantity: 3,
        subtotal: 150,
      },
    ],
    subtotal: 700,
    discount: 30,
    tierDiscountPercent: 5,
    tierDiscountAmount: 35,
    rewardPointsEarned: 15,
    rewardPointsRedeemed: 40,
    rewardDiscountAmount: 20,
    tax_amount: (Number(form?.tax_rate || shop?.settings?.tax_rate || 0) * 700) / 100,
    delivery_fee: 50,
    total: 615 + ((Number(form?.tax_rate || shop?.settings?.tax_rate || 0) * 700) / 100) + 50,
    paid_amount: 615 + ((Number(form?.tax_rate || shop?.settings?.tax_rate || 0) * 700) / 100) + 50,
    due_amount: 0,
    tendered_amount: 1000,
    change_amount: 1000 - (615 + ((Number(form?.tax_rate || shop?.settings?.tax_rate || 0) * 700) / 100) + 50),
  }), [isBn, form, shop]);

  const updateField = (key, value) => {
    setMemoConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    // Sync paper_format with main form if relevant
    if (key === 'paper_format' && setForm) {
      setForm((prev) => ({
        ...prev,
        paper_format: value,
      }));
    }
  };

  const handleTestPrint = () => {
    try {
      printSaleReceipt({
        order: sampleOrder,
        shop: {
          ...shop,
          settings: {
            ...(shop?.settings || {}),
            tax_rate: Number(form?.tax_rate || shop?.settings?.tax_rate || 0),
            tax_name: form?.tax_name || shop?.settings?.tax_name || 'VAT',
            cash_memo_config: memoConfig,
          },
        },
        lang,
        customConfig: memoConfig,
      });
      toast.success(
        isBn
          ? 'স্যাম্পল ক্যাশ মেমো প্রিন্ট প্রিভিউ খোলা হয়েছে!'
          : 'Sample cash memo print preview opened!'
      );
    } catch (err) {
      console.error('Print preview error:', err);
      toast.error('Failed to trigger print preview.');
    }
  };

  const handleResetDefaults = () => {
    setMemoConfig({
      template: 'modern',
      accent_color: '#00a86b',
      paper_format: '80mm',
      custom_width_mm: 80,
      font_size_scale: 'standard',
      spacing_density: 'normal',
      watermark_type: 'none',
      watermark_text: 'PAID',
      header_notice: '',
      memo_title: 'CASH MEMO / INVOICE',
      memo_title_bn: 'ক্যাশ মেমো ও বিক্রয় চালান',
      header_slogan: '',
      show_logo: true,
      show_tagline: true,
      show_address: true,
      show_phone: true,
      show_email: false,
      show_website: false,
      show_social_links: false,
      show_bin_vat: true,
      show_invoice_time: true,
      show_cashier_name: true,
      show_customer_phone: true,
      show_customer_address: true,
      show_customer_due: true,
      show_line_serial: false,
      show_item_sku: true,
      show_item_unit: false,
      show_item_discount: true,
      show_tax_breakdown: true,
      show_delivery_fee: false,
      show_barcode: true,
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
    });
    toast.success(isBn ? 'ডিফল্ট সেটিংসে রিসেট করা হয়েছে।' : 'Reset to default memo template.');
  };

  // Preview paper width in pixels
  const previewWidthPx = useMemo(() => {
    const fmt = memoConfig.paper_format || '80mm';
    if (fmt === '58mm') return 240;
    if (fmt === 'A4') return 420;
    if (fmt === 'A5') return 340;
    if (fmt === 'custom') {
      const w = Number(memoConfig.custom_width_mm) || 80;
      return Math.min(440, Math.max(220, Math.round(w * 3.6)));
    }
    return 300; // 80mm
  }, [memoConfig.paper_format, memoConfig.custom_width_mm]);

  return (
    <div className="space-y-6">
      
      {/* -------------------------------------------------------- */}
      {/* TOP HEADER & ACTION BAR                                  */}
      {/* -------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/20 p-4 rounded-2xl border border-emerald-500/20">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00a86b] dark:text-[#00df89]" />
            <span>{isBn ? 'ক্যাশ মেমো, ইনভয়েস ও পিওএস প্রিন্ট স্টুডিও' : 'Cash Memo, Invoice & POS Print Studio'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {isBn
              ? 'কাস্টম পেপার সাইজ, কালার থিম, হেডার নোটিশ, ওয়াটারমার্ক, কিউআর ও লাইভ প্রিভিউ সহ মেমো সাজান।'
              : 'Customize paper dimensions, color themes, header notices, watermarks, QR codes, and live preview.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetDefaults}
            className="h-9 px-3 text-xs gap-1.5 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিসেট' : 'Reset'}</span>
          </Button>

          <Button
            type="button"
            onClick={handleTestPrint}
            className="h-9 px-4 text-xs gap-2 bg-[#00a86b] hover:bg-[#00925d] text-white shadow-xs font-semibold"
          >
            <Printer className="w-4 h-4" />
            <span>{isBn ? 'আউটপুট টেস্ট প্রিন্ট' : 'Test Print Memo'}</span>
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* 2-COLUMN LAYOUT: CONTROLS (LEFT) + LIVE PREVIEW (RIGHT) */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================== */}
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS (7 COLUMNS)       */}
        {/* ====================================================== */}
        <div className="lg:col-span-7 space-y-5">

          {/* 1. TEMPLATE SELECTION */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Layout className="w-4 h-4 text-[#00a86b]" />
              <span>{isBn ? '১. মেমো লেআউট ও ভিজ্যুয়াল স্টাইল' : '1. Layout & Visual Theme'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => {
                const isSelected = (memoConfig.template || 'modern') === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => updateField('template', tmpl.id)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#00a86b] bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-[#00a86b]/20 shadow-xs'
                        : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {isBn ? tmpl.nameBn : tmpl.nameEn}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#00a86b] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {isBn ? tmpl.descBn : tmpl.descEn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* 2. PAPER SIZE, CUSTOM DIMENSIONS & FONT SCALING */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <SlidersHorizontal className="w-4 h-4 text-[#00a86b]" />
              <span>{isBn ? '২. পেপার সাইজ, কাস্টম মাপ ও টাইপোগ্রাফি' : '2. Paper Sizing, Custom Width & Font Scale'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Paper Format Custom Dropdown */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                  {isBn ? 'প্রিন্টার পেপার সাইজ (Paper Format)' : 'Printer Paper Format'}
                </label>
                <CustomSelect
                  value={memoConfig.paper_format || '80mm'}
                  onChange={(val) => updateField('paper_format', val)}
                  options={paperFormatOptions}
                />
              </div>

              {/* Custom Width Slider/Input when 'custom' is selected */}
              {memoConfig.paper_format === 'custom' && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      {isBn ? 'কাস্টম পেপারের প্রস্থ (Width in Millimeters)' : 'Custom Paper Width (in mm)'}
                    </span>
                    <Badge className="bg-amber-600 text-white font-mono text-[11px]">
                      {memoConfig.custom_width_mm || 80} mm
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="40"
                      max="250"
                      step="1"
                      value={memoConfig.custom_width_mm || 80}
                      onChange={(e) => updateField('custom_width_mm', Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                    <Input
                      type="number"
                      min="40"
                      max="250"
                      value={memoConfig.custom_width_mm || 80}
                      onChange={(e) => updateField('custom_width_mm', Number(e.target.value))}
                      className="w-20 h-8 text-xs font-mono text-center"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-zinc-400">
                    {isBn
                      ? 'যেকোনো নন-স্ট্যান্ডার্ড রসিদ প্রিন্টার বা কাস্টম রোল সাইজের জন্য মিলিমিটারে সঠিক মাপ দিন।'
                      : 'Specify the exact roll/sheet printable width in millimeters (40mm to 250mm).'}
                  </p>
                </div>
              )}

              {/* Font Size Scale Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                  {isBn ? 'ফন্ট সাইজ স্কেলিং (Font Scale)' : 'Font Size Scale'}
                </label>
                <CustomSelect
                  value={memoConfig.font_size_scale || 'standard'}
                  onChange={(val) => updateField('font_size_scale', val)}
                  options={fontSizeOptions}
                />
              </div>

              {/* Spacing & Density Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                  {isBn ? 'প্যাডিং ও লাইন স্পেসিং (Density)' : 'Line Spacing & Density'}
                </label>
                <CustomSelect
                  value={memoConfig.spacing_density || 'normal'}
                  onChange={(val) => updateField('spacing_density', val)}
                  options={spacingDensityOptions}
                />
              </div>

              {/* Brand Accent Color */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2 block">
                  {isBn ? 'ব্র্যান্ড কালার থিম (Accent Color)' : 'Brand Accent Color'}
                </label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => updateField('accent_color', c.hex)}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border border-white/40 shadow-2xs flex items-center justify-center ${
                        memoConfig.accent_color === c.hex ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                      }`}
                    >
                      {memoConfig.accent_color === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  
                  {/* Custom Hex Picker */}
                  <div className="relative flex items-center gap-2 ml-2 pl-3 border-l border-slate-200 dark:border-zinc-700">
                    <input
                      type="color"
                      value={memoConfig.accent_color || '#00a86b'}
                      onChange={(e) => updateField('accent_color', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                      title="Pick custom color"
                    />
                    <span className="text-[11px] font-mono text-slate-500 uppercase">
                      {memoConfig.accent_color || '#00a86b'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </Card>

          {/* 3. HEADER BRANDING, TITLES & FLASH NOTICE */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-[#00a86b]" />
              <span>{isBn ? '৩. মেমো হেডার, স্লোগান ও টাইটেল' : '3. Header Titles, Branding & Flash Notices'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                  {isBn ? 'মেমো টাইটেল (English)' : 'Memo Title (English)'}
                </label>
                <Input
                  value={memoConfig.memo_title || ''}
                  onChange={(e) => updateField('memo_title', e.target.value)}
                  placeholder="CASH MEMO / INVOICE"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                  {isBn ? 'মেমো টাইটেল (বাংলা)' : 'Memo Title (Bengali)'}
                </label>
                <Input
                  value={memoConfig.memo_title_bn || ''}
                  onChange={(e) => updateField('memo_title_bn', e.target.value)}
                  placeholder="ক্যাশ মেমো ও বিক্রয় চালান"
                  className="h-9 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                  {isBn ? 'হেডার স্লোগান / ধর্মীয় বাণী (ঐচ্ছিক)' : 'Header Slogan / Religious Text (Optional)'}
                </label>
                <Input
                  value={memoConfig.header_slogan || ''}
                  onChange={(e) => updateField('header_slogan', e.target.value)}
                  placeholder="বিসমিল্লাহির রাহমানির রাহিম / Quality You Can Trust"
                  className="h-9 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                  {isBn ? 'ফ্ল্যাশ হেডার অফার নোটিশ (ঐচ্ছিক)' : 'Header Flash Offer Notice (Optional)'}
                </label>
                <Input
                  value={memoConfig.header_notice || ''}
                  onChange={(e) => updateField('header_notice', e.target.value)}
                  placeholder="Special Eid Discount: 10% Off on all items!"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Header Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {[
                { key: 'show_logo', labelEn: 'Shop Logo', labelBn: 'দোকানের লোগো' },
                { key: 'show_tagline', labelEn: 'Shop Tagline', labelBn: 'ট্যাগলাইন' },
                { key: 'show_address', labelEn: 'Store Address', labelBn: 'ঠিকানা' },
                { key: 'show_phone', labelEn: 'Phone Number', labelBn: 'ফোন নম্বর' },
                { key: 'show_email', labelEn: 'Email Address', labelBn: 'ইমেইল' },
                { key: 'show_website', labelEn: 'Website', labelBn: 'ওয়েবসাইট' },
                { key: 'show_bin_vat', labelEn: 'BIN / VAT No', labelBn: 'ভ্যাট / বিআইএন নং' },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={memoConfig[toggle.key] !== false}
                    onChange={(e) => updateField(toggle.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                  />
                  <span>{isBn ? toggle.labelBn : toggle.labelEn}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* 4. CUSTOMER, POS & FINANCIAL CALCULATION FIELDS */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Sliders className="w-4 h-4 text-[#00a86b]" />
              <span>{isBn ? '৪. গ্রাহক, পিওএস ও হিসাবের বিবরণী' : '4. Customer, POS & Calculations'}</span>
            </div>

            {/* Default Payment Method Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                {isBn ? 'ডিফল্ট পিওএস পেমেন্ট মাধ্যম' : 'Default POS Payment Method'}
              </label>
              <CustomSelect
                value={form?.default_payment_method || 'Cash'}
                onChange={(val) => {
                  if (setForm) {
                    setForm((prev) => ({ ...prev, default_payment_method: val }));
                  }
                }}
                options={paymentMethodOptions}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              {[
                { key: 'show_invoice_time', labelEn: 'Time on Date', labelBn: 'তারিখে সময়' },
                { key: 'show_cashier_name', labelEn: 'Cashier Name', labelBn: 'ক্যাশিয়ারের নাম' },
                { key: 'show_customer_phone', labelEn: 'Customer Phone', labelBn: 'গ্রাহকের ফোন' },
                { key: 'show_customer_address', labelEn: 'Customer Address', labelBn: 'গ্রাহকের ঠিকানা' },
                { key: 'show_customer_due', labelEn: 'Customer Due Balance', labelBn: 'গ্রাহকের মোট বকেয়া' },
                { key: 'show_line_serial', labelEn: 'Line Serial (#)', labelBn: 'ক্রমিক নম্বর (#)' },
                { key: 'show_item_sku', labelEn: 'Product SKU/Code', labelBn: 'পণ্যের এসকেইউ' },
                { key: 'show_item_unit', labelEn: 'Unit (kg, pcs)', labelBn: 'পরিমাপের একক' },
                { key: 'show_tax_breakdown', labelEn: 'VAT / Tax Line', labelBn: 'ভ্যাট / ট্যাক্স লাইন' },
                { key: 'show_delivery_fee', labelEn: 'Delivery Charge', labelBn: 'ডেলিভারি চার্জ' },
                { key: 'show_barcode', labelEn: 'Barcode on Invoice', labelBn: 'ইনভয়েস বারকোড' },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={memoConfig[toggle.key] !== false}
                    onChange={(e) => updateField(toggle.key, e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                  />
                  <span>{isBn ? toggle.labelBn : toggle.labelEn}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* 5. WATERMARKS, RETURN POLICY, QR & SIGNATURES */}
          <Card className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Stamp className="w-4 h-4 text-[#00a86b]" />
              <span>{isBn ? '৫. ওয়াটারমার্ক, রিটার্ন পলিসি, কিউআর ও স্বাক্ষর' : '5. Watermark, Return Policy, QR & Signature'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Watermark Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                  {isBn ? 'ব্যাকগ্রাউন্ড ওয়াটারমার্ক (Watermark)' : 'Background Watermark'}
                </label>
                <CustomSelect
                  value={memoConfig.watermark_type || 'none'}
                  onChange={(val) => updateField('watermark_type', val)}
                  options={watermarkOptions}
                />
              </div>

              {/* QR Code Action Dropdown */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 block">
                  {isBn ? 'QR কোডের গন্তব্য (QR Target)' : 'QR Code Action Target'}
                </label>
                <CustomSelect
                  value={memoConfig.qr_code_type || 'invoice'}
                  onChange={(val) => updateField('qr_code_type', val)}
                  options={qrCodeOptions}
                />
              </div>

              {/* Custom Watermark Text */}
              {memoConfig.watermark_type === 'custom' && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                    {isBn ? 'কাস্টম ওয়াটারমার্ক টেক্সট' : 'Custom Watermark Text'}
                  </label>
                  <Input
                    value={memoConfig.watermark_text || ''}
                    onChange={(e) => updateField('watermark_text', e.target.value)}
                    placeholder="PAID / COPY / MY STORE"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Return Policy Text */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={memoConfig.show_return_policy !== false}
                  onChange={(e) => updateField('show_return_policy', e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                />
                <span>{isBn ? 'রিটার্ন ও এক্সচেঞ্জ পলিসি মেমোতে দেখান' : 'Show Return & Exchange Policy Note'}</span>
              </label>

              {memoConfig.show_return_policy !== false && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                  <Input
                    value={memoConfig.return_policy_text || ''}
                    onChange={(e) => updateField('return_policy_text', e.target.value)}
                    placeholder="Goods once sold can only be exchanged within 7 days."
                    className="h-8 text-xs"
                  />
                  <Input
                    value={memoConfig.return_policy_text_bn || ''}
                    onChange={(e) => updateField('return_policy_text_bn', e.target.value)}
                    placeholder="বিক্রিত পণ্য মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Authorized Signature Line */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(memoConfig.show_signature_line)}
                  onChange={(e) => updateField('show_signature_line', e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                />
                <span>{isBn ? 'কর্তৃপক্ষের স্বাক্ষর লাইন ও সিল বক্স যোগ করুন' : 'Show Authorized Signature Stamp Line'}</span>
              </label>

              {memoConfig.show_signature_line && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-5">
                  <Input
                    value={memoConfig.signature_label || ''}
                    onChange={(e) => updateField('signature_label', e.target.value)}
                    placeholder="Authorized Signature"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={memoConfig.signature_label_bn || ''}
                    onChange={(e) => updateField('signature_label_bn', e.target.value)}
                    placeholder="কর্তৃপক্ষের স্বাক্ষর"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Digital QR Code & Powered by */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={memoConfig.show_qr_code !== false}
                  onChange={(e) => updateField('show_qr_code', e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                />
                <QrCode className="w-3.5 h-3.5 text-[#00a86b]" />
                <span>{isBn ? 'যাচাইকরণ QR কোড' : 'Digital Verification QR'}</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 cursor-pointer text-xs font-medium text-slate-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={memoConfig.show_powered_by !== false}
                  onChange={(e) => updateField('show_powered_by', e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00a86b] focus:ring-[#00df89] accent-[#00a86b]"
                />
                <span>{isBn ? 'Powered by Shopo ব্যাজ' : 'Show "Powered by Shopo"'}</span>
              </label>
            </div>

            {/* Footer Thank You Note */}
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1 block">
                {isBn ? 'রসিদের শেষ বার্তা (Thank You Note)' : 'Footer Thank You Greeting'}
              </label>
              <Input
                value={isBn ? (memoConfig.footer_note_bn || '') : (memoConfig.footer_note || '')}
                onChange={(e) => updateField(isBn ? 'footer_note_bn' : 'footer_note', e.target.value)}
                placeholder="Thank you for shopping with us! Please come again."
                className="h-9 text-xs"
              />
            </div>
          </Card>
        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: STICKY REAL-TIME VISUAL PREVIEW          */}
        {/* ====================================================== */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
          
          {/* Preview Toolbar & Zoom */}
          <div className="flex items-center justify-between px-1 bg-slate-100 dark:bg-zinc-800/80 p-2 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-[#00a86b]" />
              <span>{isBn ? 'লাইভ প্রিভিউ' : 'Live Preview'}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.max(75, z - 15))}
                title="Zoom out"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 w-8 text-center">
                {previewZoom}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoom((z) => Math.min(135, z + 15))}
                title="Zoom in"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Mock Paper Frame */}
          <div className="bg-slate-200 dark:bg-zinc-950 p-3 sm:p-4 rounded-2xl border border-slate-300 dark:border-zinc-800 shadow-inner flex justify-center overflow-hidden">
            
            {/* The Actual Receipt Sheet */}
            <div
              style={{
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
                fontFamily: memoConfig.template === 'thermal' ? "'Courier New', monospace" : "'Hind Siliguri', 'Inter', sans-serif",
                maxWidth: `${previewWidthPx}px`,
                fontSize: memoConfig.font_size_scale === 'compact' ? '9.5px' : memoConfig.font_size_scale === 'large' ? '12.5px' : '11px',
              }}
              className={`w-full bg-white text-slate-900 p-4 rounded-lg shadow-md border leading-tight transition-all duration-200 select-none relative ${
                memoConfig.template === 'classic'
                  ? 'border-2 border-slate-900'
                  : 'border-slate-200'
              }`}
            >
              
              {/* Background Watermark Overlay */}
              {memoConfig.watermark_type && memoConfig.watermark_type !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                  <span className="text-3xl font-black text-black/5 -rotate-30 uppercase tracking-widest whitespace-nowrap">
                    {memoConfig.watermark_type === 'custom'
                      ? (memoConfig.watermark_text || 'PAID')
                      : memoConfig.watermark_type === 'original'
                      ? 'ORIGINAL COPY'
                      : (isBn ? 'পরিশোধিত' : 'PAID')}
                  </span>
                </div>
              )}

              {/* Flash Header Notice */}
              {memoConfig.header_notice && (
                <div
                  style={{
                    backgroundColor: `${memoConfig.accent_color || '#00a86b'}15`,
                    color: memoConfig.accent_color || '#00a86b',
                    borderColor: `${memoConfig.accent_color || '#00a86b'}35`,
                  }}
                  className="text-center text-[9px] font-bold py-1 px-2 rounded mb-2 border border-dashed relative z-10"
                >
                  ⚡ {memoConfig.header_notice}
                </div>
              )}

              {/* Header Box */}
              <div
                className={`text-center pb-2 relative z-10 ${
                  memoConfig.template === 'bold'
                    ? 'p-3 rounded-lg text-white mb-2'
                    : memoConfig.template === 'classic'
                    ? 'border-b-2 border-double border-slate-900 pb-2 mb-2'
                    : 'border-b border-dashed border-slate-300 mb-2'
                }`}
                style={{
                  backgroundColor: memoConfig.template === 'bold' ? (memoConfig.accent_color || '#00a86b') : 'transparent',
                }}
              >
                {memoConfig.header_slogan && (
                  <div className="text-[9px] opacity-80 mb-1">{memoConfig.header_slogan}</div>
                )}

                {memoConfig.show_logo !== false && shop?.logo_url && (
                  <div className="flex justify-center mb-1.5">
                    <img src={shop.logo_url} alt="Shop Logo" className="h-8 max-w-[100px] object-contain" />
                  </div>
                )}

                <div
                  style={{ color: memoConfig.template === 'bold' ? '#ffffff' : (memoConfig.accent_color || '#00a86b') }}
                  className="font-black text-sm uppercase tracking-wide"
                >
                  {shop?.name || 'Shopo Store'}
                </div>

                {memoConfig.show_tagline !== false && shop?.tagline && (
                  <div className="text-[9.5px] italic opacity-85">{shop.tagline}</div>
                )}

                {memoConfig.show_address !== false && (
                  <div className="text-[9.5px] text-slate-600 mt-0.5">{shop?.address?.line1 || 'Dhanmondi 27'}, {shop?.address?.city || 'Dhaka'}</div>
                )}

                {memoConfig.show_phone !== false && (
                  <div className="text-[9.5px] font-semibold mt-0.5">
                    {isBn ? 'ফোন' : 'Phone'}: {shop?.phone || '01900-123456'}
                  </div>
                )}

                {memoConfig.show_bin_vat !== false && shop?.bin_vat_number && (
                  <div className="text-[9px] font-bold text-slate-600 mt-0.5">BIN: {shop.bin_vat_number}</div>
                )}

                {/* Memo Badge */}
                <div className="mt-1.5">
                  <span
                    style={{
                      backgroundColor: memoConfig.template === 'bold' ? '#ffffff' : `${memoConfig.accent_color || '#00a86b'}15`,
                      color: memoConfig.accent_color || '#00a86b',
                      borderColor: `${memoConfig.accent_color || '#00a86b'}40`,
                    }}
                    className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-md border"
                  >
                    {isBn ? (memoConfig.memo_title_bn || 'ক্যাশ মেমো ও বিক্রয় চালান') : (memoConfig.memo_title || 'CASH MEMO / INVOICE')}
                  </span>
                </div>
              </div>

              {/* Invoice & Customer Meta */}
              <div className="text-[10px] space-y-1 mb-2 relative z-10">
                <div className="flex justify-between">
                  <span><strong>{isBn ? 'চালান নং' : 'Invoice #'}:</strong> #{sampleOrder.invoice_number}</span>
                  <span><strong>{isBn ? 'মাধ্যম' : 'Pay'}:</strong> {sampleOrder.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>{isBn ? 'তারিখ' : 'Date'}:</strong> {new Date().toLocaleDateString()} {memoConfig.show_invoice_time !== false ? '14:30' : ''}</span>
                  {memoConfig.show_cashier_name !== false && (
                    <span><strong>{isBn ? 'ক্যাশিয়ার' : 'Billed By'}:</strong> Kazi Farhan</span>
                  )}
                </div>

                <div className="pt-1 border-t border-dashed border-slate-200">
                  <div className="flex justify-between items-center">
                    <span><strong>{isBn ? 'ক্রেতা' : 'Customer'}:</strong> {sampleOrder.customer_id.name}</span>
                    <span className="text-[8.5px] bg-amber-100 text-amber-800 font-bold px-1 rounded">👑 VIP</span>
                  </div>
                  {memoConfig.show_customer_phone !== false && (
                    <div><strong>{isBn ? 'মোবাইল' : 'Phone'}:</strong> {sampleOrder.customer_id.phone}</div>
                  )}
                  {memoConfig.show_customer_address !== false && (
                    <div><strong>{isBn ? 'ঠিকানা' : 'Address'}:</strong> {sampleOrder.customer_id.address}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[10px] mb-2 relative z-10">
                <thead>
                  <tr style={{ borderBottom: `1.5px solid ${memoConfig.accent_color || '#00a86b'}` }}>
                    {memoConfig.show_line_serial && <th className="py-1">#</th>}
                    <th className="py-1">{isBn ? 'পণ্য' : 'Item'}</th>
                    <th className="py-1 text-right">{isBn ? 'দর × পরিমাণ' : 'Price × Qty'}</th>
                    <th className="py-1 text-right">{isBn ? 'মোট' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200">
                  {sampleOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      {memoConfig.show_line_serial && <td className="py-1 text-slate-400">{idx + 1}</td>}
                      <td className="py-1 pr-1">
                        <div className="font-bold">{it.name}</div>
                        {it.variant_name && (
                          <span className="text-[8.5px] bg-slate-100 text-slate-700 px-1 rounded border border-slate-200">
                            {it.variant_name}
                          </span>
                        )}
                        {memoConfig.show_item_sku !== false && (
                          <div className="text-[8px] text-slate-400 font-mono">SKU: {it.sku}</div>
                        )}
                      </td>
                      <td className="py-1 text-right whitespace-nowrap">
                        ৳{it.unit_price} × {it.quantity}{memoConfig.show_item_unit ? ` ${it.unit}` : ''}
                      </td>
                      <td className="py-1 text-right font-bold whitespace-nowrap">৳{it.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="text-[10px] space-y-0.5 border-t border-dashed border-slate-300 pt-1 relative z-10">
                <div className="flex justify-between">
                  <span>{isBn ? 'উপমোট (Subtotal):' : 'Subtotal:'}</span>
                  <span>৳{sampleOrder.subtotal}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>{isBn ? 'বিশেষ ছাড় (Discount):' : 'Discount:'}</span>
                  <span>- ৳{sampleOrder.discount}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{isBn ? 'গোল্ড মেম্বার ছাড় (5%):' : 'Gold Tier Discount (5%):'}</span>
                  <span>- ৳{sampleOrder.tierDiscountAmount}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>{isBn ? 'পয়েন্ট ছাড় (40 pts):' : 'Points Discount (40 pts):'}</span>
                  <span>- ৳{sampleOrder.rewardDiscountAmount}</span>
                </div>

                {memoConfig.show_tax_breakdown && (
                  <div className="flex justify-between text-slate-600">
                    <span>{form?.tax_name || 'VAT'} ({form?.tax_rate || 0}%):</span>
                    <span>+ ৳{sampleOrder.tax_amount}</span>
                  </div>
                )}

                {memoConfig.show_delivery_fee && (
                  <div className="flex justify-between text-slate-600">
                    <span>{isBn ? 'ডেলিভারি চার্জ:' : 'Delivery Fee:'}</span>
                    <span>+ ৳{sampleOrder.delivery_fee}</span>
                  </div>
                )}

                {/* Net Grand Total */}
                <div
                  style={{
                    color: memoConfig.accent_color || '#00a86b',
                    borderColor: memoConfig.accent_color || '#00a86b',
                  }}
                  className="flex justify-between font-black text-xs py-1 border-y-2 my-1"
                >
                  <span>{isBn ? 'সর্বমোট বিল (Net Total):' : 'Grand Total:'}</span>
                  <span>৳{sampleOrder.total}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>{isBn ? 'পরিশোধ (Paid):' : 'Paid Amount:'}</span>
                  <span>৳{sampleOrder.paid_amount}</span>
                </div>

                {memoConfig.show_customer_due !== false && sampleOrder.customer_id.total_due > 0 && (
                  <div className="flex justify-between text-[9px] text-rose-600 font-semibold">
                    <span>{isBn ? 'গ্রাহকের পূর্বের বকেয়া:' : 'Previous Due Balance:'}</span>
                    <span>৳{sampleOrder.customer_id.total_due}</span>
                  </div>
                )}
              </div>

              {/* Barcode */}
              {memoConfig.show_barcode !== false && (
                <div className="text-center mt-2.5 pt-1.5 border-t border-dashed border-slate-200 relative z-10">
                  <div className="h-6 w-32 bg-slate-800 mx-auto rounded flex items-center justify-center text-white text-[8px] tracking-widest font-mono">
                    ||||| | |||| ||| ||
                  </div>
                  <span className="text-[7.5px] font-mono text-slate-400">*{sampleOrder.invoice_number}*</span>
                </div>
              )}

              {/* Return Policy Box */}
              {memoConfig.show_return_policy !== false && (
                <div className="mt-2 p-1.5 rounded bg-slate-50 border border-slate-200 text-[8px] text-slate-600 text-center leading-tight relative z-10">
                  <strong>{isBn ? 'শর্তাবলী:' : 'Terms:'}</strong>{' '}
                  {isBn ? (memoConfig.return_policy_text_bn || 'বিক্রিত পণ্য মেমোসহ ৭ দিনের মধ্যে পরিবর্তনযোগ্য।') : (memoConfig.return_policy_text || 'Goods once sold can only be exchanged within 7 days.')}
                </div>
              )}

              {/* QR & Signature Line */}
              {(memoConfig.show_qr_code !== false || memoConfig.show_signature_line) && (
                <div className="flex justify-between items-end mt-3 pt-2 border-t border-dashed border-slate-200 relative z-10">
                  {memoConfig.show_qr_code !== false ? (
                    <div className="text-center">
                      <div className="w-9 h-9 bg-slate-100 border border-slate-300 rounded flex items-center justify-center mx-auto mb-0.5">
                        <QrCode className="w-6 h-6 text-slate-800" />
                      </div>
                      <span className="text-[7.5px] text-slate-400 font-mono">
                        {memoConfig.qr_code_type === 'bkash' ? 'bKash Pay' : memoConfig.qr_code_type === 'website' ? 'Web Link' : (isBn ? 'যাচাই কোড' : 'Verify')}
                      </span>
                    </div>
                  ) : <div />}

                  {memoConfig.show_signature_line && (
                    <div className="text-center min-w-[90px]">
                      <div className="border-t border-slate-700 pt-1 text-[8px] font-bold text-slate-700">
                        {isBn ? (memoConfig.signature_label_bn || 'কর্তৃপক্ষের স্বাক্ষর') : (memoConfig.signature_label || 'Authorized Signature')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Note */}
              <div className="text-center text-[8.5px] text-slate-500 mt-2.5 pt-1.5 border-t border-dashed border-slate-200 relative z-10">
                <div className="font-semibold">
                  {isBn ? (memoConfig.footer_note_bn || 'আমাদের সাথে কেনাকাটা করার জন্য ধন্যবাদ!') : (memoConfig.footer_note || 'Thank you for shopping with us! Please come again.')}
                </div>
                {memoConfig.show_powered_by !== false && (
                  <div className="text-[7.5px] text-slate-400 mt-0.5">Powered by Shopo (shopo.com.bd)</div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
