/**
 * @file BarcodeLabelModal.jsx
 * @description Interactive Barcode & Product Label Printing Studio.
 * Allows choosing products and variants, setting label copies, selecting
 * paper templates (A4 sticker sheets or thermal roll printers), customizing fields,
 * seeing real-time SVG barcode preview, and executing print jobs.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  X,
  Plus,
  Minus,
  Trash2,
  Settings2,
  Eye,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Tag,
  Store,
  DollarSign,
  Maximize2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  BARCODE_PRESETS,
  renderBarcodeElement,
  printBarcodeLabelsViaIframe,
} from '../../utils/barcodePrinter';
import toast from 'react-hot-toast';

export const BarcodeLabelModal = ({
  isOpen,
  onClose,
  initialProducts = [],
  allProducts = [],
  shopInfo = {},
  lang = 'en',
}) => {
  // Label Print Queue Items
  const [printItems, setPrintItems] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('thermal_50x30');
  const [customWidthMm, setCustomWidthMm] = useState('50');
  const [customHeightMm, setCustomHeightMm] = useState('30');

  // Label Customization Settings
  const [settings, setSettings] = useState({
    showShopName: true,
    customShopName: shopInfo?.name || 'SHOPO STORE',
    showProductName: true,
    showVariantName: true,
    showBarcode: true,
    showBarcodeText: true,
    showPrice: true,
    currencySymbol: '৳',
    pricePrefix: 'MRP:',
    customFooter: '',
  });

  // Selected preset object with dynamic custom dimension calculation
  const basePreset = BARCODE_PRESETS.find((p) => p.id === selectedPresetId) || BARCODE_PRESETS[0];
  const currentPreset =
    selectedPresetId === 'custom_roll'
      ? {
          ...basePreset,
          widthMm: Math.max(15, parseFloat(customWidthMm) || 50),
          heightMm: Math.max(10, parseFloat(customHeightMm) || 30),
          barcodeHeight: Math.max(16, Math.min(60, Math.round((parseFloat(customHeightMm) || 30) * 0.75))),
          barcodeWidth: Math.max(0.8, Math.min(2.5, +((parseFloat(customWidthMm) || 50) / 38).toFixed(2))),
          fontSize: Math.max(7, Math.min(13, Math.round((parseFloat(customHeightMm) || 30) * 0.28))),
        }
      : basePreset;

  // Ref for the live sample preview barcode SVG
  const sampleBarcodeSvgRef = useRef(null);

  // Initialize print items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const items = [];
    (initialProducts || []).forEach((prod) => {
      if (prod.has_variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
        prod.variants.forEach((v) => {
          items.push({
            id: `${prod.id || prod._id}_${v._id || v.id}`,
            productId: prod.id || prod._id,
            variantId: v._id || v.id,
            name: prod.name,
            variant_name: v.name,
            barcode: v.barcode || v.sku || prod.barcode || prod.sku || String(v._id || prod.id || '').slice(-8).toUpperCase(),
            selling_price: v.selling_price || prod.sellPrice || prod.selling_price || 0,
            unit: prod.unit || 'pcs',
            stock: v.stock_quantity || 0,
            copies: 1,
          });
        });
      } else {
        items.push({
          id: `${prod.id || prod._id}`,
          productId: prod.id || prod._id,
          variantId: null,
          name: prod.name,
          variant_name: '',
          barcode: prod.barcode || prod.sku || String(prod.id || prod._id || '').slice(-8).toUpperCase(),
          selling_price: prod.sellPrice || prod.selling_price || 0,
          unit: prod.unit || 'pcs',
          stock: prod.stock || prod.stock_quantity || 0,
          copies: 1,
        });
      }
    });

    setPrintItems(items);
    if (shopInfo?.name) {
      setSettings((prev) => ({ ...prev, customShopName: shopInfo.name }));
    }
  }, [isOpen, initialProducts, shopInfo]);

  // Update sample live preview barcode whenever settings or preview item changes
  const sampleItem = printItems[0] || {
    name: 'Sample Product Name',
    variant_name: 'Navy Blue / L',
    barcode: 'SP-8829-XL',
    selling_price: 250,
    unit: 'pcs',
  };

  useEffect(() => {
    if (sampleBarcodeSvgRef.current && settings.showBarcode) {
      const code = sampleItem.barcode || 'SP-8829-XL';
      renderBarcodeElement(sampleBarcodeSvgRef.current, code, {
        height: currentPreset.barcodeHeight || 24,
        width: currentPreset.barcodeWidth || 1.3,
      });
    }
  }, [sampleItem, settings.showBarcode, currentPreset, printItems]);

  if (!isOpen) return null;

  // Add a product or its variants to print queue
  const handleAddProductToQueue = (productId) => {
    const prod = allProducts.find((p) => String(p.id || p._id) === String(productId));
    if (!prod) return;

    const newItems = [];
    if (prod.has_variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
      prod.variants.forEach((v) => {
        const itemKey = `${prod.id || prod._id}_${v._id || v.id}`;
        if (!printItems.some((it) => it.id === itemKey)) {
          newItems.push({
            id: itemKey,
            productId: prod.id || prod._id,
            variantId: v._id || v.id,
            name: prod.name,
            variant_name: v.name,
            barcode: v.barcode || v.sku || prod.barcode || prod.sku || String(v._id || prod.id || '').slice(-8).toUpperCase(),
            selling_price: v.selling_price || prod.sellPrice || prod.selling_price || 0,
            unit: prod.unit || 'pcs',
            stock: v.stock_quantity || 0,
            copies: 1,
          });
        }
      });
    } else {
      const itemKey = `${prod.id || prod._id}`;
      if (!printItems.some((it) => it.id === itemKey)) {
        newItems.push({
          id: itemKey,
          productId: prod.id || prod._id,
          variantId: null,
          name: prod.name,
          variant_name: '',
          barcode: prod.barcode || prod.sku || String(prod.id || prod._id || '').slice(-8).toUpperCase(),
          selling_price: prod.sellPrice || prod.selling_price || 0,
          unit: prod.unit || 'pcs',
          stock: prod.stock || prod.stock_quantity || 0,
          copies: 1,
        });
      }
    }

    if (newItems.length === 0) {
      toast(lang === 'bn' ? 'পণ্যটি ইতিমধ্যেই তালিকায় যুক্ত আছে।' : 'Product is already in print list.');
      return;
    }

    setPrintItems((prev) => [...prev, ...newItems]);
    toast.success(lang === 'bn' ? 'তালিকায় যুক্ত হয়েছে' : 'Added to print list');
  };

  // Quick Quantity Helpers
  const handleSetCopiesAll = (copies) => {
    setPrintItems((prev) => prev.map((it) => ({ ...it, copies: Math.max(0, parseInt(copies, 10) || 0) })));
  };

  const handleSetCopiesToStock = () => {
    setPrintItems((prev) => prev.map((it) => ({ ...it, copies: Math.max(1, parseInt(it.stock, 10) || 1) })));
    toast.success(lang === 'bn' ? 'স্টক পরিমাণ অনুযায়ী কপি সেট করা হয়েছে!' : 'Copies set to available stock quantities!');
  };

  const handleRemoveItem = (id) => {
    setPrintItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleCopiesChange = (id, copies) => {
    setPrintItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, copies: Math.max(0, parseInt(copies, 10) || 0) } : it))
    );
  };

  const handleStepCopies = (id, delta) => {
    setPrintItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const current = parseInt(it.copies, 10) || 0;
          return { ...it, copies: Math.max(0, current + delta) };
        }
        return it;
      })
    );
  };

  const handleBarcodeCodeChange = (id, newCode) => {
    setPrintItems((prev) => prev.map((it) => (it.id === id ? { ...it, barcode: newCode } : it)));
  };

  const totalLabelsToPrint = printItems.reduce((sum, it) => sum + (parseInt(it.copies, 10) || 0), 0);

  // Execute Print
  const handleExecutePrint = () => {
    if (totalLabelsToPrint === 0) {
      toast.error(lang === 'bn' ? 'প্রিন্ট করার জন্য কোনো কপি নেই।' : 'No label copies selected to print.');
      return;
    }

    printBarcodeLabelsViaIframe({
      items: printItems,
      settings: {
        ...settings,
        presetId: selectedPresetId,
        customWidthMm: parseFloat(customWidthMm) || 50,
        customHeightMm: parseFloat(customHeightMm) || 30,
      },
      shopInfo,
    });
    toast.success(lang === 'bn' ? 'প্রিন্ট ডায়ালগ চালু হচ্ছে...' : 'Opening print dialog...');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <Card className="max-w-5xl w-full p-0 bg-white dark:bg-[#121215] border-slate-200/80 dark:border-zinc-800/80 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 shrink-0 bg-slate-50/60 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00df89]/10 border border-[#00df89]/25 flex items-center justify-center text-[#00a86b] dark:text-[#00df89] shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'বারকোড ও প্রাইস লেবেল প্রিন্ট স্টুডিও' : 'Barcode & Price Label Studio'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/20">
                  {totalLabelsToPrint} {lang === 'bn' ? 'টি স্টিকার' : 'Stickers'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn'
                  ? 'থার্মাল রোল প্রিন্টার বা A4 স্টিকার শিটে পণ্যের বারকোড ও মূল্য প্রিন্ট করুন'
                  : 'Generate scan-ready barcodes for Thermal Roll printers or A4 sticker sheets'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Split View (Left: Queue & Controls, Right: Live Preview & Settings) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-zinc-800/80">
          {/* Left Column (7 cols): Print Queue & Product Selection */}
          <div className="lg:col-span-7 flex flex-col overflow-hidden p-4 sm:p-5 space-y-3.5">
            {/* Quick Add Product Dropdown */}
            <div className="space-y-1.5 shrink-0">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? '+ তালিকায় আরও পণ্য যোগ করুন' : '+ Add More Products to Print List'}
              </label>
              <Select
                value="__add_placeholder__"
                onValueChange={(val) => {
                  if (val !== '__add_placeholder__') {
                    handleAddProductToQueue(val);
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800 text-xs h-9.5 rounded-xl font-medium focus:ring-1 focus:ring-[#00df89]">
                  <SelectValue placeholder={lang === 'bn' ? 'পণ্য বাছুন...' : 'Search and choose product...'} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__add_placeholder__">
                    {lang === 'bn' ? 'পণ্য বেছে নিন...' : 'Choose product to add...'}
                  </SelectItem>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id || p._id} value={p.id || p._id}>
                      {p.name} {p.has_variants ? `(${p.variants?.length || 0} variants)` : `(Stock: ${p.stock || p.stock_quantity || 0})`} — ৳{p.sellPrice || p.selling_price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Copies Action Bar */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-900/40 border border-slate-200/70 dark:border-zinc-800/80 flex-wrap gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'কপি সংখ্যা দ্রুত সেট:' : 'Bulk Set Copies:'}</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSetCopiesToStock}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#00a86b] dark:text-[#00df89] bg-[#00df89]/10 hover:bg-[#00df89]/20 border border-[#00df89]/30 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'স্টক সমান কপি' : 'Match Stock Qty'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCopiesAll(1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  1 {lang === 'bn' ? 'টি করে' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCopiesAll(5)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  5 {lang === 'bn' ? 'টি করে' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCopiesAll(10)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  10 {lang === 'bn' ? 'টি করে' : 'All'}
                </button>
              </div>
            </div>

            {/* Print Items Table */}
            <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-[#09090b]">
              {printItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Tag className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-700" />
                  <p className="text-xs font-semibold">
                    {lang === 'bn' ? 'কোনো পণ্য নির্বাচন করা হয়নি।' : 'No products in label print queue.'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'উপরের ড্রপডাউন থেকে পণ্য যোগ করুন।' : 'Select a product from the dropdown above.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/90 dark:bg-zinc-900/80 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10 text-[11px]">
                    <tr>
                      <th className="p-3">{lang === 'bn' ? 'পণ্য ও ভ্যারিয়েশন' : 'Product & Variation'}</th>
                      <th className="p-3">{lang === 'bn' ? 'বারকোড' : 'Barcode / SKU'}</th>
                      <th className="p-3">{lang === 'bn' ? 'মূল্য' : 'Price'}</th>
                      <th className="p-3 w-28 text-center">{lang === 'bn' ? 'কপি' : 'Copies'}</th>
                      <th className="p-3 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {printItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-900/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{item.name}</div>
                          {item.variant_name && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border border-[#00df89]/25 mt-0.5">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{item.variant_name}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            {lang === 'bn' ? 'স্টক:' : 'Stock:'} {item.stock} {item.unit}
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.barcode}
                            onChange={(e) => handleBarcodeCodeChange(item.id, e.target.value)}
                            className="w-28 px-2 py-1 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[11px] font-bold text-slate-800 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#00df89]"
                          />
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white text-xs">
                          ৳{Number(item.selling_price).toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-0.5">
                            <button
                              type="button"
                              onClick={() => handleStepCopies(item.id, -1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.copies}
                              onChange={(e) => handleCopiesChange(item.id, e.target.value)}
                              className="w-10 bg-transparent text-center text-xs font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleStepCopies(item.id, 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Template Settings & Live Interactive Preview */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-zinc-900/20">
            {/* Paper / Printer Preset Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {lang === 'bn' ? 'লেবেল ফরম্যাট ও প্রিন্টার টাইপ *' : 'Label Format & Printer Type *'}
              </label>
              <Select value={selectedPresetId} onValueChange={(val) => setSelectedPresetId(val)}>
                <SelectTrigger className="w-full bg-white dark:bg-[#09090b] border-slate-200 dark:border-zinc-800 text-xs h-9.5 rounded-xl font-semibold focus:ring-1 focus:ring-[#00df89]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'থার্মাল রোল প্রিন্টার (Thermal Rolls)' : 'Thermal Roll Printers'}
                  </div>
                  {BARCODE_PRESETS.filter((p) => p.type === 'roll').map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.id === 'custom_roll' ? '⚙️' : '🖨️'} {lang === 'bn' ? p.nameBn : p.name}
                    </SelectItem>
                  ))}

                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
                    {lang === 'bn' ? 'স্ট্যান্ডার্ড A4 স্টিকার শিট (A4 Sheets)' : 'Standard A4 Sticker Sheets'}
                  </div>
                  {BARCODE_PRESETS.filter((p) => p.type === 'sheet').map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      📄 {lang === 'bn' ? p.nameBn : p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom Dimensions Input Box (Visible when Custom Size is selected) */}
              {selectedPresetId === 'custom_roll' && (
                <div className="p-3 rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-2.5 animate-in fade-in duration-200 mt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#00df89]" />
                      <span>{lang === 'bn' ? 'কাস্টম লেবেল সাইজ নির্ধারণ করুন (মিমি)' : 'Custom Label Size (Millimeters)'}</span>
                    </span>
                    <span className="text-[10px] text-[#00a86b] dark:text-[#00df89] font-bold">
                      {customWidthMm || 50}mm × {customHeightMm || 30}mm
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                        {lang === 'bn' ? 'প্রস্থ (Width mm)' : 'Width (mm)'}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="15"
                          max="210"
                          value={customWidthMm}
                          onChange={(e) => setCustomWidthMm(e.target.value)}
                          placeholder="50"
                          className="w-full px-2.5 py-1.5 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                        <span className="absolute right-2.5 text-[10px] font-semibold text-slate-400 pointer-events-none">mm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                        {lang === 'bn' ? 'উচ্চতা (Height mm)' : 'Height (mm)'}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="10"
                          max="297"
                          value={customHeightMm}
                          onChange={(e) => setCustomHeightMm(e.target.value)}
                          placeholder="30"
                          className="w-full px-2.5 py-1.5 pr-8 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                        <span className="absolute right-2.5 text-[10px] font-semibold text-slate-400 pointer-events-none">mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick popular size presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-slate-400 font-semibold">{lang === 'bn' ? 'দ্রুত মাপ:' : 'Popular:'}</span>
                    {[
                      { w: 35, h: 25 },
                      { w: 40, h: 30 },
                      { w: 50, h: 30 },
                      { w: 60, h: 40 },
                      { w: 80, h: 50 },
                      { w: 100, h: 50 },
                      { w: 100, h: 150 },
                    ].map((sz) => (
                      <button
                        key={`${sz.w}x${sz.h}`}
                        type="button"
                        onClick={() => {
                          setCustomWidthMm(String(sz.w));
                          setCustomHeightMm(String(sz.h));
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          String(customWidthMm) === String(sz.w) && String(customHeightMm) === String(sz.h)
                            ? 'bg-[#00df89]/15 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/40'
                            : 'bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                        }`}
                      >
                        {sz.w}×{sz.h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live Sticker Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'লাইভ স্টিকার প্রিভিউ' : 'Live Label Preview'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {currentPreset.widthMm}mm x {currentPreset.heightMm}mm
                </span>
              </div>

              {/* Visual Simulated Sticker Canvas */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/70 dark:from-zinc-900/80 dark:to-[#0c0c0e] flex items-center justify-center min-h-[180px] border border-slate-200/80 dark:border-zinc-800">
                <div
                  className="bg-white text-zinc-950 shadow-md rounded-lg p-3 flex flex-col justify-between select-none transition-all border border-slate-200/60"
                  style={{
                    width: `${Math.min(235, currentPreset.widthMm * 4.2)}px`,
                    minHeight: `${Math.min(175, currentPreset.heightMm * 4.2)}px`,
                  }}
                >
                  {/* Top: Shop / Brand Name */}
                  {settings.showShopName && (
                    <div className="text-xs font-black tracking-wider uppercase text-zinc-900 truncate w-full text-center pb-0.5">
                      {settings.customShopName || 'SHOPO STORE'}
                    </div>
                  )}

                  {/* Middle: SVG Barcode & Prominent Barcode Number */}
                  <div className="flex flex-col items-center justify-center my-auto w-full py-0.5">
                    {settings.showBarcode && (
                      <div className="w-full flex items-center justify-center overflow-hidden">
                        <svg ref={sampleBarcodeSvgRef} className="max-w-[96%] h-8" />
                      </div>
                    )}

                    {settings.showBarcodeText && (
                      <div className="text-xs font-extrabold text-zinc-950 tracking-wider text-center mt-0.5">
                        {sampleItem.barcode || '123456789101'}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Left (Product & Variant) / Right (Large Price) */}
                  <div className="flex items-end justify-between w-full pt-1 gap-2 mt-auto">
                    {/* Left: Product Name & Variant */}
                    <div className="flex flex-col items-start text-left min-w-0 flex-1">
                      {settings.showProductName && (
                        <div className="text-[11px] font-bold text-zinc-900 truncate w-full leading-tight">
                          {sampleItem.name}
                        </div>
                      )}
                      {settings.showVariantName && sampleItem.variant_name && (
                        <div className="text-[10px] font-semibold text-zinc-600 truncate w-full leading-tight">
                          {sampleItem.variant_name}
                        </div>
                      )}
                      {settings.customFooter && (
                        <div className="text-[8px] text-zinc-500 font-medium truncate w-full mt-0.5">
                          {settings.customFooter}
                        </div>
                      )}
                    </div>

                    {/* Right: Large Bold Price */}
                    {settings.showPrice && (
                      <div className="flex items-baseline justify-end text-right shrink-0">
                        {settings.pricePrefix && (
                          <span className="text-[9px] text-zinc-500 font-bold mr-0.5">{settings.pricePrefix}</span>
                        )}
                        <span className="text-base font-extrabold text-zinc-950 tracking-tight">
                          {settings.currencySymbol}
                          {Number(sampleItem.selling_price || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#00df89]" />
                <span>{lang === 'bn' ? 'লেবেলে প্রদর্শিত ফিল্ডসমূহ' : 'Visible Label Fields'}</span>
              </div>

              {/* Quick Toggle Chips Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showShopName: !settings.showShopName })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showShopName
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showShopName ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'দোকানের নাম' : 'Shop Name'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showProductName: !settings.showProductName })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showProductName
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showProductName ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showVariantName: !settings.showVariantName })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showVariantName
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showVariantName ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'ভ্যারিয়েশন ট্যাগ' : 'Variant Tag'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showBarcode: !settings.showBarcode })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showBarcode
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showBarcode ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'বারকোড লাইন' : 'Barcode Lines'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showBarcodeText: !settings.showBarcodeText })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showBarcodeText
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showBarcodeText ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'SKU / কোড টেক্সট' : 'SKU / Code Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showPrice: !settings.showPrice })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.showPrice
                      ? 'bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] border-[#00df89]/30'
                      : 'bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${settings.showPrice ? 'text-[#00df89]' : 'text-slate-300 dark:text-zinc-700'}`} />
                  <span>{lang === 'bn' ? 'বিক্রয়মূল্য' : 'Selling Price'}</span>
                </button>
              </div>

              {/* Contextual Custom Inputs */}
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                {settings.showShopName && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                      {lang === 'bn' ? 'দোকানের নাম টেক্সট' : 'Shop / Business Name'}
                    </label>
                    <input
                      type="text"
                      placeholder="Shop Name"
                      value={settings.customShopName}
                      onChange={(e) => setSettings({ ...settings, customShopName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                    />
                  </div>
                )}

                {settings.showPrice && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        {lang === 'bn' ? 'মূল্য প্রিফিক্স' : 'Price Prefix'}
                      </label>
                      <input
                        type="text"
                        placeholder="MRP:"
                        value={settings.pricePrefix}
                        onChange={(e) => setSettings({ ...settings, pricePrefix: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                        {lang === 'bn' ? 'মুদ্রার প্রতীক' : 'Currency Symbol'}
                      </label>
                      <input
                        type="text"
                        placeholder="৳"
                        value={settings.currencySymbol}
                        onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    {lang === 'bn' ? 'ঐচ্ছিক ফুটার বার্তা' : 'Footer Note (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'bn' ? 'যেমন: Made in BD / No Return' : 'e.g. Made in BD / Non-refundable'}
                    value={settings.customFooter}
                    onChange={(e) => setSettings({ ...settings, customFooter: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/80 shrink-0 bg-slate-50/60 dark:bg-zinc-900/40">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <span>{lang === 'bn' ? 'মোট স্টিকার:' : 'Total stickers:'} </span>
            <strong className="text-slate-900 dark:text-white text-sm font-bold">{totalLabelsToPrint}</strong>
            {currentPreset.type === 'sheet' && totalLabelsToPrint > 0 && (
              <span className="ml-2 text-slate-400">
                (~{Math.ceil(totalLabelsToPrint / (currentPreset.columns * currentPreset.rowsPerPage))} {lang === 'bn' ? 'টি A4 শিট' : 'A4 sheets'})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl cursor-pointer"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={totalLabelsToPrint === 0}
              onClick={handleExecutePrint}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold cursor-pointer gap-1.5 shadow-md shadow-[#00df89]/20 rounded-xl px-4"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বারকোড লেবেল প্রিন্ট করুন' : 'Print Barcode Labels'}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
