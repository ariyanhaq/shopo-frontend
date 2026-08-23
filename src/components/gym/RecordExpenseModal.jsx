/**
 * @file RecordExpenseModal.jsx
 * @description Facility expense recording modal with dynamic custom category creation.
 */
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { X, DollarSign, CheckCircle2, Loader2, Plus, FolderPlus } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const DEFAULT_GYM_CATEGORIES = [
  'Rent',
  'Electricity & Utilities',
  'Equipment Maintenance',
  'Salaries',
  'Marketing & Ads',
  'Cleaning & Supplies',
  'Supplements & Retail Stock',
  'Other Operational'
];

export default function RecordExpenseModal({ isOpen, onClose, onRecordExpense }) {
  useBodyScrollLock(isOpen);
  const { lang } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('shopo_gym_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [formData, setFormData] = useState({
    category: 'Rent',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'bKash'
  });

  const allCategories = useMemo(() => {
    return [...new Set([...DEFAULT_GYM_CATEGORIES, ...customCategories])];
  }, [customCategories]);

  if (!isOpen) return null;

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name.');
      return;
    }

    if (!customCategories.includes(trimmed) && !DEFAULT_GYM_CATEGORIES.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('shopo_gym_custom_expense_categories', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not save custom categories:', err);
      }
    }

    setFormData(prev => ({ ...prev, category: trimmed }));
    setIsAddingNewCat(false);
    setNewCatName('');
    toast.success(`Category '${trimmed}' added!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      toast.error('Please enter expense description and amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.expenses.create({
        title: formData.title.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        description: `Paid via ${formData.method}`,
      });

      toast.success(lang === 'bn' ? 'খরচ সফলভাবে এন্ট্রি করা হয়েছে!' : 'Expense recorded successfully!');
      if (onRecordExpense) {
        onRecordExpense(res.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to record expense in database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-500" />
            <span className="font-medium text-base text-slate-900 dark:text-white">
              Log Facility Expense
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-normal">
          
          {/* Category Selector with Inline Add New */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700 dark:text-zinc-300">Expense Category *</label>
              {!isAddingNewCat && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(true)}
                  className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Category</span>
                </button>
              )}
            </div>

            {isAddingNewCat ? (
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5">
                  <FolderPlus className="w-4 h-4 text-[#00df89]" />
                  <span className="font-semibold text-[11px] text-slate-800 dark:text-zinc-200">
                    Enter New Category Name
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Generator Fuel, AC Servicing"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      }
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewCategory}
                    className="h-8 px-2.5 bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewCat(false);
                      setNewCatName('');
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Select
                value={formData.category}
                onValueChange={(val) => {
                  if (val === '__add_new__') {
                    setIsAddingNewCat(true);
                  } else {
                    setFormData({ ...formData, category: val });
                  }
                }}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="__add_new__" className="font-bold text-[#00a86b] dark:text-[#00df89]">
                    ➕ + Add New Custom Category...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Description / Note *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. August AC Servicing"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Amount (৳) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="5000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Payment Method</label>
              <Select
                value={formData.method}
                onValueChange={(val) => setFormData({ ...formData, method: val })}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-zinc-900">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Rocket">Rocket</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs px-5 gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save to DB</span>
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
