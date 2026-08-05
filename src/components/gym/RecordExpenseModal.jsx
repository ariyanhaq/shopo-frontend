/**
 * @file RecordExpenseModal.jsx
 * @description Modal dialog for logging operational gym facility expenses.
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';

export default function RecordExpenseModal({ isOpen, onClose, onRecordExpense }) {
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    category: 'Rent',
    title: '',
    amount: 10000,
    date: new Date().toISOString().split('T')[0],
    method: 'bKash'
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Please enter expense description');
      return;
    }

    const newExp = {
      id: `exp-${Date.now()}`,
      ...formData,
      amount: parseFloat(formData.amount) || 0
    };

    onRecordExpense(newExp);
    onClose();
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
          <div>
            <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Expense Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
            >
              <option value="Rent">Facility Rent</option>
              <option value="Electricity">Electricity & AC Bills</option>
              <option value="Maintenance">Equipment Maintenance</option>
              <option value="Salaries">Instructor Salaries</option>
              <option value="Marketing">Marketing & Ads</option>
              <option value="Cleaning">Cleaning & Supplies</option>
              <option value="Other">Other Operational</option>
            </select>
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
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Amount (৳)</label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            <div>
              <label className="font-medium text-slate-700 dark:text-zinc-300 mb-1 block">Payment Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#00df89]"
              >
                <option value="bKash">bKash</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Button variant="outline" type="button" onClick={onClose} className="text-xs font-medium">
              Cancel
            </Button>
            <Button type="submit" className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs px-5 gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Save Expense
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
