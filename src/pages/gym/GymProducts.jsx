/**
 * @file GymProducts.jsx
 * @description Gym Merchandise & Supplements catalog page (Water bottles, supplements, t-shirts, trousers, shaker bottles).
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Package, DollarSign, Plus, Search, Filter, AlertTriangle,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Barcode,
  Layers, ShoppingCart
} from 'lucide-react';

export default function GymProducts() {
  const { lang } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initial Gym Merchandise & Supplements Dataset
  const [productList, setProductList] = useState([
    { id: 'GP-101', name: 'Shopo Gym Shaker Bottle 700ml', sku: 'GYM-WTR-01', category: 'Accessories', stock: 45, unit: 'Pcs', buyPrice: 250, sellPrice: 450, status: 'in_stock' },
    { id: 'GP-102', name: 'Whey Protein Isolate 1kg (Chocolate)', sku: 'GYM-SUP-02', category: 'Supplements', stock: 12, unit: 'Tubs', buyPrice: 4200, sellPrice: 5200, status: 'low_stock' },
    { id: 'GP-103', name: 'Shopo Performance Dry-Fit Gym T-Shirt (M/L)', sku: 'GYM-APP-03', category: 'Apparel', stock: 30, unit: 'Pcs', buyPrice: 450, sellPrice: 850, status: 'in_stock' },
    { id: 'GP-104', name: 'Athletic Compression Sweat Trousers', sku: 'GYM-APP-04', category: 'Apparel', stock: 18, unit: 'Pcs', buyPrice: 650, sellPrice: 1250, status: 'in_stock' },
    { id: 'GP-105', name: 'Creatine Monohydrate 300g (Unflavored)', sku: 'GYM-SUP-05', category: 'Supplements', stock: 8, unit: 'Tubs', buyPrice: 1800, sellPrice: 2400, status: 'low_stock' },
    { id: 'GP-106', name: 'Heavy Duty Leather Gym Wrist Gloves', sku: 'GYM-ACC-06', category: 'Accessories', stock: 25, unit: 'Pairs', buyPrice: 350, sellPrice: 650, status: 'in_stock' },
    { id: 'GP-107', name: 'Mineral Water 1L Bottle', sku: 'GYM-BEV-07', category: 'Beverages', stock: 120, unit: 'Bottles', buyPrice: 20, sellPrice: 35, status: 'in_stock' }
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Supplements',
    sku: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs'
  });

  const filteredProducts = useMemo(() => {
    return productList.filter(prod => {
      const matchesStatus = stockStatusFilter === 'all' || prod.status === stockStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.category.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [productList, searchQuery, stockStatusFilter]);

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return;

    const created = {
      id: `GP-${100 + productList.length + 1}`,
      name: newProduct.name,
      sku: newProduct.sku || `GYM-PROD-${productList.length + 1}`,
      category: newProduct.category,
      stock: Number(newProduct.stock) || 10,
      unit: newProduct.unit,
      buyPrice: Number(newProduct.buyPrice) || 0,
      sellPrice: Number(newProduct.sellPrice) || 0,
      status: Number(newProduct.stock) > 10 ? 'in_stock' : 'low_stock'
    };

    setProductList([created, ...productList]);
    setIsAddModalOpen(false);
    setNewProduct({ name: '', category: 'Supplements', sku: '', stock: '', buyPrice: '', sellPrice: '', unit: 'Pcs' });
  };

  const totalStockValue = productList.reduce((acc, p) => acc + p.stock * p.sellPrice, 0);
  const lowStockCount = productList.filter(p => p.status === 'low_stock').length;

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
            Gym Products & Merchandise Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            Manage water bottles, supplements, t-shirts, trousers & gym accessories stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
          >
            <Plus className="w-4 h-4 stroke-[2]" />
            <span>Add Gym Product</span>
          </Button>
        </div>
      </div>

      {/* PRODUCTS SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-slate-900 dark:text-white">{productList.length} Merch SKUs</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-normal">Active inventory catalog</div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">Low Stock Items</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-slate-900 dark:text-white">{lowStockCount} items</div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-normal">Re-order required</div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">Total Stock Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-slate-900 dark:text-white">৳ {totalStockValue.toLocaleString()}</div>
            <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-normal">Total asset value</div>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-zinc-400">Merchandise Groups</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="text-2xl font-normal text-slate-900 dark:text-white">4 Categories</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 font-normal">Supplements, Apparel, Accessories</div>
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shaker bottles, protein, t-shirts, trousers..."
            className="pl-10 dark:bg-[#09090b]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'in_stock', label: 'In Stock' },
            { id: 'low_stock', label: 'Low Stock' }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStockStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-normal transition-colors shrink-0 cursor-pointer ${
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
              <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 font-normal">
                <th className="p-4 font-medium">Product & SKU</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Stock Quantity</th>
                <th className="p-4 text-right font-medium">Buy / Sell Price</th>
                <th className="p-4 text-center font-medium">Status</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-normal">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900 dark:text-white">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">SKU: {prod.sku}</div>
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
                    <Badge variant={prod.status === 'in_stock' ? 'default' : 'warning'} className="uppercase text-[10px] font-normal">
                      {prod.status === 'in_stock' ? 'in stock' : 'low stock'}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1 font-normal dark:bg-[#09090b]">
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <h3 className="font-medium text-base text-slate-900 dark:text-white">Add Gym Product / Merchandise</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs font-normal">
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-700 dark:text-zinc-300">Product Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Whey Protein Isolate 1kg or Dry-Fit T-Shirt"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="dark:bg-[#09090b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#09090b] px-3 text-xs font-normal text-slate-900 dark:text-white"
                  >
                    <option value="Supplements">Supplements</option>
                    <option value="Apparel">Apparel (T-Shirts & Trousers)</option>
                    <option value="Accessories">Accessories (Bottles & Gloves)</option>
                    <option value="Beverages">Beverages & Water</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">SKU / Barcode</label>
                  <Input
                    type="text"
                    placeholder="GYM-SUP-09"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Stock Qty</label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Buy Price (৳)</label>
                  <Input
                    type="number"
                    placeholder="450"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                    className="dark:bg-[#09090b]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700 dark:text-zinc-300">Sell Price (৳)</label>
                  <Input
                    type="number"
                    required
                    placeholder="850"
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
