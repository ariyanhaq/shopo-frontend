import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, Edit2, Trash2, CheckCircle2, Loader2, X, Search } from 'lucide-react';

export default function Categories() {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.categories.list();
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.warn('Failed to load categories:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCategory && editingCategory._id) {
        await api.categories.update(editingCategory._id, {
          name: categoryName.trim(),
          description: categoryDesc.trim(),
        });
        toast.success(lang === 'bn' ? 'ক্যাটাগরি আপডেট করা হয়েছে!' : 'Category updated successfully!');
      } else {
        await api.categories.create({
          name: categoryName.trim(),
          description: categoryDesc.trim(),
        });
        toast.success(lang === 'bn' ? 'ক্যাটাগরি সফলভাবে তৈরি হয়েছে!' : 'Category created successfully!');
      }
      setIsModalOpen(false);
      setCategoryName('');
      setCategoryDesc('');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm(lang === 'bn' ? 'আপনি কি এই ক্যাটাগরিটি মুছে ফেলতে চান?' : 'Delete this category?')) {
      try {
        await api.categories.delete(id);
        toast.success(lang === 'bn' ? 'ক্যাটাগরি মুছে ফেলা হয়েছে!' : 'Category deleted successfully!');
        fetchCategories();
      } catch (err) {
        toast.error(err.message || 'Failed to delete category.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'পণ্য ক্যাটাগরি ব্যবস্থাপনা' : 'Product Categories'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'পণ্যের গ্রুপিং ও ক্যাটাগরি তৈরি করুন' : 'Organize and structure your catalog with product categories'}
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingCategory(null);
            setCategoryName('');
            setCategoryDesc('');
            setIsModalOpen(true);
          }}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন ক্যাটাগরি' : 'Add Category'}</span>
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-3">
          <Tag className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Categories Created Yet</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Create categories to group and classify your inventory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card key={cat._id} className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-slate-900 dark:text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{cat.description || 'General category'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(cat);
                    setCategoryName(cat.name);
                    setCategoryDesc(cat.description || '');
                    setIsModalOpen(true);
                  }}
                  className="h-7 text-xs gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(cat._id)}
                  className="h-7 text-xs text-rose-500 hover:text-rose-600 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dairy & Frozen"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief note about items in this category"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Category'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
