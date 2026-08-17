/**
 * @file GymProducts.jsx
 * @description Gym Merchandise, Apparel & Supplements catalog connected directly to MongoDB.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, DollarSign, Plus, Search, Filter, AlertTriangle,
  Download, Edit2, Trash2, CheckCircle2, Clock, X, Barcode,
  Layers, ShoppingCart, Loader2
} from 'lucide-react';

export default function GymProducts() {
  const { lang } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productList, setProductList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Supplements',
    sku: '',
    stock: '',
    buyPrice: '',
    sellPrice: '',
    unit: 'Pcs'
  });

  const fetchProducts = async () => {
    try {
      const res = await api.products.list();
      if (res.data) {
        setProductList(res.data);
      }
    } catch (err) {
      console.warn('Failed to load products from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return productList.filter(prod => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.sku && prod.sku.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [productList, searchQuery]);

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sellPrice) return;

    setIsSubmitting(true);
    try {
      await api.products.create({
        name: newProduct.name,
        sku: newProduct.sku || `SKU-${Date.now().toString().slice(-6)}`,
        cost_price: parseFloat(newProduct.buyPrice) || 0,
        selling_price: parseFloat(newProduct.sellPrice) || 0,
        stock_quantity: parseInt(newProduct.stock, 10) || 0,
        unit: newProduct.unit || 'Pcs',
        low_stock_threshold: 5,
      });

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        category: 'Supplements',
        sku: '',
        stock: '',
        buyPrice: '',
        sellPrice: '',
        unit: 'Pcs'
      });
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Failed to save product in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await api.products.delete(id);
        fetchProducts();
      } catch (err) {
        alert(err.message || 'Failed to delete product.');
      }
    }
  };

  const totalCatalogItems = productList.length;
  const totalStockUnits = productList.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
  const totalStockValue = productList.reduce((acc, p) => acc + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'সাপ্লিমেন্টস ও মার্চেন্ডাইজ' : 'Gym Supplements & Merchandise'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'প্রোটিন, শ্যাকার বোতল, জিম টি-শার্ট ও আনুষাঙ্গিক ইনভেন্টরি' : 'Manage supplements, fitness gear, apparel & merchandise inventory'}
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন পণ্য যোগ করুন' : 'Add New Product'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Catalog SKUs</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{totalCatalogItems} items</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Stock On Hand</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{totalStockUnits} units</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Inventory Asset Value</div>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-1">৳ {totalStockValue.toLocaleString()}</div>
        </Card>
      </div>

      {/* SEARCH */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'পণ্যের নাম বা SKU খুঁজুন...' : 'Search by name or SKU...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* PRODUCTS TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading supplements & products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Products in Database</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Add merchandise or supplements to start retailing from your gym counter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Stock Level</th>
                  <th className="p-3.5">Cost (৳)</th>
                  <th className="p-3.5">Price (৳)</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-xs">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">{p.sku || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className={p.stock_quantity <= (p.low_stock_threshold || 5) ? 'text-amber-500 font-medium' : 'text-slate-800 dark:text-zinc-200'}>
                        {p.stock_quantity} {p.unit || 'pcs'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-zinc-400">৳ {(p.cost_price || 0).toLocaleString()}</td>
                    <td className="p-3.5 font-medium text-[#00a86b] dark:text-[#00df89]">৳ {(p.selling_price || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(p._id)}
                        className="h-7 text-xs text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ADD PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">Add Product to Gym Catalog</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whey Protein Isolate 1kg"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Cost Price (৳)</label>
                  <input
                    type="number"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Selling Price (৳) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Product'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
