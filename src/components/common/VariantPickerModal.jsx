import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  X,
  Search,
  Plus,
  Minus,
  Check,
  Package,
  Sparkles,
  Tag,
  AlertTriangle,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Comprehensive color palette for auto-detecting variation colors
const COLOR_MAP = {
  red: '#ef4444',
  crimson: '#dc2626',
  blue: '#3b82f6',
  navy: '#1e3a8a',
  royalblue: '#2563eb',
  sky: '#0284c7',
  cyan: '#06b6d4',
  teal: '#0d9488',
  pink: '#ec4899',
  rose: '#f43f5e',
  magenta: '#d946ef',
  green: '#10b981',
  emerald: '#059669',
  forest: '#166534',
  lime: '#84cc16',
  yellow: '#eab308',
  amber: '#f59e0b',
  gold: '#d97706',
  orange: '#f97316',
  coral: '#fb7185',
  purple: '#a855f7',
  violet: '#7c3aed',
  indigo: '#6366f1',
  black: '#18181b',
  white: '#ffffff',
  gray: '#71717a',
  grey: '#71717a',
  silver: '#94a3b8',
  brown: '#78350f',
  chocolate: '#451a03',
  beige: '#f5f5dc',
  maroon: '#800000',
  olive: '#808000',
  khaki: '#f0e68c',
  // Bengali keywords
  লাল: '#ef4444',
  নীল: '#3b82f6',
  সবুজ: '#10b981',
  হলুদ: '#eab308',
  কালো: '#18181b',
  সাদা: '#ffffff',
  গোলাপি: '#ec4899',
  কমলা: '#f97316',
  বেগুনি: '#a855f7',
  বাদামী: '#78350f',
  ধূসর: '#71717a',
  খয়েরি: '#800000',
  আকাশি: '#0284c7',
};

// Common size labels
const SIZE_SET = new Set([
  'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', '4xl', 'free size',
  '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
]);

/**
 * Extract detected color code from name or attributes
 */
function extractColor(name, attributes = []) {
  if (!name && (!attributes || attributes.length === 0)) return null;

  // Check attributes first
  if (Array.isArray(attributes)) {
    for (const attr of attributes) {
      if (attr?.name?.toLowerCase().includes('color') || attr?.name?.toLowerCase().includes('রং')) {
        const val = String(attr?.value || '').toLowerCase().trim();
        if (COLOR_MAP[val]) return COLOR_MAP[val];
        for (const [k, hex] of Object.entries(COLOR_MAP)) {
          if (val.includes(k)) return hex;
        }
      }
    }
  }

  // Check name tokens
  const cleanName = String(name || '').toLowerCase();
  const words = cleanName.split(/[\s\-_/,\+]+/);
  for (const w of words) {
    if (COLOR_MAP[w]) return COLOR_MAP[w];
  }
  for (const [k, hex] of Object.entries(COLOR_MAP)) {
    if (cleanName.includes(k)) return hex;
  }

  return null;
}

/**
 * Extract detected size label from name or attributes
 */
function extractSize(name, attributes = []) {
  if (Array.isArray(attributes)) {
    for (const attr of attributes) {
      if (attr?.name?.toLowerCase().includes('size') || attr?.name?.toLowerCase().includes('সাইজ')) {
        return String(attr?.value || '').toUpperCase();
      }
    }
  }

  const cleanName = String(name || '').toLowerCase();
  const words = cleanName.split(/[\s\-_/,\+]+/);
  for (const w of words) {
    if (SIZE_SET.has(w)) return w.toUpperCase();
  }

  return null;
}

/**
 * High-end, interactive Variant Picker Modal
 */
export default function VariantPickerModal({
  product,
  isOpen = true,
  onClose,
  onAddVariant,
  onUpdateVariantQty,
  cart = [],
  lang = 'en',
  mode = 'memo', // 'memo' | 'pos'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'instock'

  const parentId = product?.id || product?._id;
  const variants = useMemo(() => (Array.isArray(product?.variants) ? product.variants : []), [product]);
  const unit = product?.unit ? (product.unit === 'piece' ? 'pcs' : product.unit) : 'pcs';

  // Calculate total in-stock count across variants
  const totalStock = useMemo(() => {
    if (!product) return 0;
    if (variants.length > 0) {
      return variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0);
    }
    return Number(product.stock || product.stock_quantity) || 0;
  }, [variants, product]);

  // Map cart items corresponding to this product's variants
  const cartVariantMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(cart) || !parentId) return map;

    for (const item of cart) {
      const matchParent =
        String(item.product_id) === String(parentId) ||
        String(item.id).startsWith(`${parentId}_`) ||
        String(item.cart_id).startsWith(`${parentId}_`);

      if (matchParent && item.variant_id) {
        map[String(item.variant_id)] = (map[String(item.variant_id)] || 0) + (Number(item.qty) || 1);
      }
    }
    return map;
  }, [cart, parentId]);

  // Total quantity of this product currently in cart
  const currentProductCartCount = useMemo(() => {
    return Object.values(cartVariantMap).reduce((a, b) => a + b, 0);
  }, [cartVariantMap]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return variants.filter((v) => {
      const stock = Number(v.stock_quantity) || 0;
      if (stockFilter === 'instock' && stock <= 0) return false;

      if (!q) return true;
      const vName = String(v.name || '').toLowerCase();
      const vSku = String(v.sku || '').toLowerCase();
      const vBarcode = String(v.barcode || '').toLowerCase();
      return vName.includes(q) || vSku.includes(q) || vBarcode.includes(q);
    });
  }, [variants, searchQuery, stockFilter]);

  // Keyboard shortcut listener (Esc to close, 1-9 for quick selection)
  useEffect(() => {
    if (!isOpen || !product) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }

      // If user is not typing in the search box, numbers 1-9 can trigger fast variant add
      if (
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        /^[1-9]$/.test(e.key)
      ) {
        const index = parseInt(e.key, 10) - 1;
        if (filteredVariants[index]) {
          const selectedVariant = filteredVariants[index];
          const stock = Number(selectedVariant.stock_quantity) || 0;
          if (stock > 0 || stock === 0) { // allow adding
            onAddVariant?.(product, selectedVariant);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredVariants, onAddVariant, onClose, product]);

  // Reset local state when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setStockFilter('all');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Handler for adding/incrementing
  const handleAdd = (variant) => {
    onAddVariant?.(product, variant);
  };

  // Handler for decrementing
  const handleDecrement = (variant) => {
    if (onUpdateVariantQty) {
      onUpdateVariantQty(product, variant, -1);
    }
  };

  // Add all in-stock variations
  const handleAddAllInStock = () => {
    const inStockList = variants.filter((v) => (Number(v.stock_quantity) || 0) > 0);
    inStockList.forEach((v) => {
      onAddVariant?.(product, v);
    });
  };

  const productImg =
    product.image_url ||
    (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-default"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header Banner */}
          <div className="relative p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 bg-gradient-to-b from-slate-50/70 to-white dark:from-zinc-900/50 dark:to-[#121215]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Product Thumbnail or Dynamic Icon */}
                {productImg ? (
                  <img
                    src={productImg}
                    alt={product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-zinc-700/80 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-[#00df89] border border-emerald-500/20 flex items-center justify-center shadow-xs shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                )}

                {/* Product Title & Stock Status */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight truncate">
                      {product.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                        totalStock > 5
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border-emerald-500/20'
                          : totalStock > 0
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          totalStock > 0 ? 'bg-emerald-500 dark:bg-[#00df89] animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      {totalStock} {unit} {lang === 'bn' ? 'স্টকে আছে' : 'in stock'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>
                      {mode === 'pos'
                        ? lang === 'bn'
                          ? 'বিলে যোগ করতে ভ্যারিয়েশন নির্বাচন করুন:'
                          : 'Select variation to add to bill:'
                        : lang === 'bn'
                        ? 'মেমোতে যোগ করতে ভ্যারিয়েশন নির্বাচন করুন:'
                        : 'Select variation to add to memo:'}
                    </span>
                    {product.category && (
                      <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                        {product.category}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Search & Filter Bar (Shown if > 2 variants) */}
            {variants.length > 2 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'ভ্যারিয়েশনের নাম বা SKU দিয়ে খুঁজুন...'
                        : 'Search variation name or SKU...'
                    }
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* In Stock Only filter toggle */}
                <button
                  type="button"
                  onClick={() => setStockFilter(stockFilter === 'all' ? 'instock' : 'all')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    stockFilter === 'instock'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00df89] border-emerald-500/30'
                      : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'স্টক আছে' : 'In Stock'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Variations List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 max-h-[50vh] custom-scrollbar">
            {filteredVariants.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Package className="w-8 h-8 mx-auto stroke-1 mb-2 opacity-50" />
                <p className="text-sm font-medium">
                  {lang === 'bn' ? 'কোনো ভ্যারিয়েশন পাওয়া যায়নি' : 'No matching variations found'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-emerald-600 dark:text-[#00df89] underline hover:no-underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'সার্চ ফিল্টার মুছুন' : 'Clear search query'}
                  </button>
                )}
              </div>
            ) : (
              filteredVariants.map((v, idx) => {
                const variantId = v._id || v.id || `idx_${idx}`;
                const stockQty = Number(v.stock_quantity) || 0;
                const isOutOfStock = stockQty <= 0;
                const inCartQty = cartVariantMap[String(variantId)] || 0;
                const colorHex = extractColor(v.name, v.attributes);
                const sizeLabel = extractSize(v.name, v.attributes);
                const price = Number(v.selling_price || product.selling_price || product.price) || 0;
                const skuCode = v.sku || product.sku || `VAR-${idx + 1}`;

                return (
                  <div
                    key={variantId}
                    onClick={() => handleAdd(v)}
                    className={`group relative p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                      inCartQty > 0
                        ? 'border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-[#00df89]/60 shadow-xs ring-1 ring-emerald-500/20'
                        : isOutOfStock
                        ? 'border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/30 opacity-75 hover:border-slate-300'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-emerald-500/60 hover:bg-emerald-50/20 dark:hover:bg-zinc-800/60 hover:shadow-xs'
                    }`}
                  >
                    {/* Left: Indicator & Details */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Keyboard Quick Hotkey (1-9) */}
                      {idx < 9 && (
                        <span className="hidden sm:flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/60 text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 group-hover:border-emerald-500/40 group-hover:text-emerald-600 dark:group-hover:text-[#00df89] transition-colors shrink-0">
                          {idx + 1}
                        </span>
                      )}

                      {/* Color Preview Swatch or Size Chip */}
                      {colorHex ? (
                        <div
                          className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs shrink-0 flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{
                            backgroundColor: colorHex,
                            boxShadow: `0 0 10px ${colorHex}40`,
                          }}
                        >
                          {colorHex === '#ffffff' && (
                            <div className="w-full h-full rounded-full border border-slate-300 dark:border-zinc-600" />
                          )}
                        </div>
                      ) : sizeLabel ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                          {sizeLabel}
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] flex items-center justify-center shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Variant Name & SKU */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-[#00df89] transition-colors truncate">
                            {v.name}
                          </h4>
                          {inCartQty > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500 text-white text-[10px] font-bold shadow-xs">
                              <Check className="w-2.5 h-2.5" /> {inCartQty} in cart
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-400 dark:text-zinc-400 font-mono tracking-tight">
                            {skuCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price, Stock & Quick Add Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-white font-mono">
                          ৳ {price.toLocaleString()}
                        </div>
                        <Badge
                          variant={
                            stockQty <= 0
                              ? 'destructive'
                              : stockQty <= 5
                              ? 'warning'
                              : 'default'
                          }
                          className="text-[10px] font-mono mt-0.5 px-2 py-0.2"
                        >
                          {stockQty <= 0
                            ? lang === 'bn'
                              ? 'স্টক নেই'
                              : 'Out of stock'
                            : `${stockQty} ${lang === 'bn' ? 'টি বাকি' : 'left'}`}
                        </Badge>
                      </div>

                      {/* Interactive Add or Stepper */}
                      {inCartQty > 0 ? (
                        <div
                          className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-emerald-500/40 rounded-xl p-0.5 shadow-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleDecrement(v)}
                            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-emerald-600 dark:text-[#00df89] font-mono">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdd(v)}
                            className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdd(v);
                          }}
                          className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-emerald-500 group-hover:text-white text-slate-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'যোগ করুন' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {currentProductCartCount > 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-[#00df89] font-semibold">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">
                    {currentProductCartCount} {lang === 'bn' ? 'আইটেম কার্টে আছে' : 'item(s) in cart'}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  💡 {lang === 'bn' ? 'কিবোর্ড শর্টকাট: ১-৯ চাপুন বা Esc দিয়ে বন্ধ করুন' : 'Tip: Press 1-9 for quick pick or Esc to close'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Optional Bulk Add All button if multiple variants are in stock */}
              {variants.filter((v) => (Number(v.stock_quantity) || 0) > 0).length > 1 && (
                <button
                  type="button"
                  onClick={handleAddAllInStock}
                  className="px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-700 dark:text-[#00df89] hover:bg-emerald-500/10 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>
                    {lang === 'bn'
                      ? `সবগুলো (${variants.filter((v) => (Number(v.stock_quantity) || 0) > 0).length}) যোগ করুন`
                      : `+ Add All (${variants.filter((v) => (Number(v.stock_quantity) || 0) > 0).length})`}
                  </span>
                </button>
              )}

              <Button
                variant={currentProductCartCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={onClose}
                className={`text-xs px-4 h-8 rounded-xl font-bold ${
                  currentProductCartCount > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs hover:opacity-90'
                    : ''
                }`}
              >
                {currentProductCartCount > 0
                  ? lang === 'bn'
                    ? 'সম্পন্ন (Done)'
                    : 'Done'
                  : lang === 'bn'
                  ? 'বাতিল (Cancel)'
                  : 'Cancel'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
