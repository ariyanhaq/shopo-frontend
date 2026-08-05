/**
 * @file Products.jsx
 * @description Comprehensive, clean Products catalog & Inventory management page for Shopo.
 */
import { useState, useMemo } from 'react';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package, DollarSign, Plus, Search, Filter, AlertTriangle,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Barcode,
  Layers, ArrowUpRight, ShieldCheck, Tag, ChevronRight
} from 'lucide-react';

export default function Products() {
  const { activeShop } = useShop();
  const { lang, t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Grains',
    sku: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs'
  });

  // Sample Products Dataset
  const initialProducts = [
    { id: 'P-101', name: 'Fresh Milk 1L (Pran)', sku: '89345001', category: 'Dairy', stock: 45, unit: 'Pcs', buyPrice: 75, sellPrice: 90, status: 'in_stock', expiry: '2026-08-10' },
    { id: 'P-102', name: 'Miniket Rice Premium 25kg', sku: '89345002', category: 'Grains', stock: 12, unit: 'Bags', buyPrice: 1650, sellPrice: 1850, status: 'low_stock', expiry: '2027-01-15' },
    { id: 'P-103', name: 'Sunflower Oil 5L (Rupchanda)', sku: '89345003', category: 'Oil & Ghee', stock: 28, unit: 'Bottles', buyPrice: 780, sellPrice: 890, status: 'in_stock', expiry: '2026-11-20' },
    { id: 'P-104', name: 'ACI Pure Salt 1kg', sku: '89345004', category: 'Spices', stock: 120, unit: 'Pcs', buyPrice: 32, sellPrice: 42, status: 'in_stock', expiry: '2028-04-01' },
    { id: 'P-105', name: 'Farm Fresh Eggs (Layer)', sku: '89345005', category: 'Poultry', stock: 8, unit: 'Trays', buyPrice: 340, sellPrice: 390, status: 'low_stock', expiry: '2026-08-08' },
    { id: 'P-106', name: 'Teer Fortified Soyabean Oil 2L', sku: '89345006', category: 'Oil & Ghee', stock: 0, unit: 'Bottles', buyPrice: 310, sellPrice: 360, status: 'out_of_stock', expiry: '2026-10-12' }
  ];

  const [productList, setProductList] = useState(initialProducts);

  // Filtered Products list
  const filteredProducts = useMemo(() => {
    return productList.filter(prod => {
      const matchesCat = categoryFilter === 'all' || prod.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = stockStatusFilter === 'all' || prod.status === stockStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);
      return matchesCat && matchesStatus && matchesSearch;
    });
  }, [productList, searchQuery, categoryFilter, stockStatusFilter]);

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return;

    const created = {
      id: `P-${100 + productList.length + 1}`,
      name: newProduct.name,
      sku: newProduct.sku || `8934500${productList.length + 1}`,
      category: newProduct.category,
      stock: Number(newProduct.stock) || 10,
      unit: newProduct.unit,
      buyPrice: Number(newProduct.buyPrice) || 0,
      sellPrice: Number(newProduct.sellPrice) || 0,
      status: Number(newProduct.stock) > 10 ? 'in_stock' : 'low_stock',
      expiry: '2027-06-30'
    };

    setProductList([created, ...productList]);
    setIsAddModalOpen(false);
    setNewProduct({ name: '', category: 'Grains', sku: '', stock: '', buyPrice: '', sellPrice: '', unit: 'Pcs' });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            {lang === 'bn' ? 'প্রোডাক্টস ও স্টক ম্যানেজমেন্ট' : 'Products & Stock Catalog'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'আপনার দোকানের সকল পণ্যের তালিকা, স্টক পরিমাণ ও ক্রয়-বিক্রয় মূল্য পরিচালনা করুন।'
              : 'Manage product items, stock levels, buying/selling prices & low stock alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium dark:bg-[#121215]">
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'এক্সপোর্ট ইনভেন্টরি' : 'Export Products'}</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>{lang === 'bn' ? 'নতুন পণ্য যুক্ত করুন' : 'Add Product'}</span>
          </Button>
        </div>
      </div>

      {/* PRODUCTS SUMMARY KPI CARDS (4 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট নিবন্ধিত পণ্য' : 'Total Products'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৩,৮৪০টি পণ্য' : '3,840 items'}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              +12 {lang === 'bn' ? 'আজ যুক্ত করা হয়েছে' : 'added today'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'স্বল্প স্টকের অ্যালার্ট' : 'Low Stock Items'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '১৮টি পণ্য' : '18 items'}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {lang === 'bn' ? 'রি-স্টক প্রয়োজন' : 'Needs restock'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ইনভেন্টরি মূল্য' : 'Total Stock Value'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৳ ১৪,২০,৫০০' : '৳ 1,420,500'}
            </div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-medium">
              {lang === 'bn' ? 'বর্তমান স্টকের দাম' : 'Current asset value'}
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'সক্রিয় ক্যাটাগরি' : 'Active Categories'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-medium text-slate-900 dark:text-white">
              {lang === 'bn' ? '৮টি গ্রুপ' : '8 Categories'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              {lang === 'bn' ? 'পণ্য বিভাগ' : 'Product groups'}
            </div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'পণ্যের নাম, বারকোড/SKU বা ক্যাটাগরি খুঁজুন...' : 'Search product name, SKU / barcode, or category...'}
            className="pl-10 dark:bg-[#09090b]"
          />
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: lang === 'bn' ? 'সব পণ্য' : 'All Products' },
            { id: 'in_stock', label: lang === 'bn' ? 'স্টকে আছে' : 'In Stock' },
            { id: 'low_stock', label: lang === 'bn' ? 'কম স্টক' : 'Low Stock' },
            { id: 'out_of_stock', label: lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStockStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                stockStatusFilter === st.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-[#09090b] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

      </Card>

      {/* PRODUCTS TABLE */}
      <Card className="border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-medium">
                <th className="p-4">{lang === 'bn' ? 'পণ্যের নাম ও SKU' : 'Product & SKU'}</th>
                <th className="p-4">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="p-4">{lang === 'bn' ? 'স্টক পরিমাণ' : 'Stock Quantity'}</th>
                <th className="p-4 text-right">{lang === 'bn' ? 'ক্রয়মূল্য / বিক্রয়মূল্য' : 'Buy / Sell Price'}</th>
                <th className="p-4 text-center">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="p-4 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
              {filteredProducts.map((prod) => (
                <tr
                  key={prod.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-white">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">SKU: {prod.sku}</div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-zinc-400 font-normal">
                    {prod.category}
                  </td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">
                    {prod.stock} {prod.unit}
                  </td>
                  <td className="p-4 text-right">
                    <div className="font-medium text-slate-900 dark:text-white">৳ {prod.sellPrice}</div>
                    <div className="text-[11px] text-slate-400 font-normal">Buy: ৳{prod.buyPrice}</div>
                  </td>
                  <td className="p-4 text-center">
                    <Badge
                      variant={
                        prod.status === 'in_stock'
                          ? 'default'
                          : prod.status === 'low_stock'
                          ? 'warning'
                          : 'destructive'
                      }
                      className="uppercase text-[10px] font-normal"
                    >
                      {prod.status === 'in_stock'
                        ? (lang === 'bn' ? 'স্টকে আছে' : 'in stock')
                        : prod.status === 'low_stock'
                        ? (lang === 'bn' ? 'কম স্টক' : 'low stock')
                        : (lang === 'bn' ? 'স্টক শেষ' : 'out of stock')}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 font-medium dark:bg-[#09090b]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-normal">
            {lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products match your search filter.'}
          </div>
        )}
      </Card>

      {/* QUICK ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="font-medium text-base text-slate-900 dark:text-white">
                {lang === 'bn' ? 'নতুন পণ্য যুক্ত করুন' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProductSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পণ্যের নাম' : 'Product Name'}
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Rupchanda Soyabean Oil 5L"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="dark:bg-[#09090b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    <option value="Grains">Grains & Rice</option>
                    <option value="Dairy">Dairy & Milk</option>
                    <option value="Oil & Ghee">Oil & Ghee</option>
                    <option value="Spices">Spices & Salt</option>
                    <option value="Poultry">Poultry & Meat</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    SKU / Barcode
                  </label>
                  <Input
                    type="text"
                    placeholder="89345099"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'স্টক সংখ্যা' : 'Stock Quantity'}
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'একক (Unit)' : 'Unit'}
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs sm:text-sm font-normal text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00df89]"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Bags">Bags</option>
                    <option value="Bottles">Bottles</option>
                    <option value="Kg">Kg</option>
                    <option value="Trays">Trays</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বিক্রয়মূল্য' : 'Sell Price (৳)'}
                  </label>
                  <Input
                    type="number"
                    required
                    placeholder="150"
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="dark:bg-[#09090b]">
                  Cancel
                </Button>
                <Button type="submit" variant="default" className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium">
                  Save Product
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
