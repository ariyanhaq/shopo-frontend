/**
 * @file GymExpenses.jsx
 * @description Gym operational expense tracker (Facility rent, electricity bills, instructor salaries, maintenance).
 */
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Calendar, FileText, Search, Trash2 } from 'lucide-react';

import RecordExpenseModal from '@/components/gym/RecordExpenseModal';
import { INITIAL_EXPENSES } from '@/data/gymData';

export default function GymExpenses() {
  const { lang } = useLanguage();

  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
  const rentExpense = expenses.filter(e => e.category === 'Rent').reduce((acc, e) => acc + e.amount, 0);
  const utilityExpense = expenses.filter(e => e.category === 'Electricity').reduce((acc, e) => acc + e.amount, 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRecordExpense = (newExp) => {
    setExpenses([newExp, ...expenses]);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this expense log?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans font-normal text-slate-800 dark:text-zinc-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#00df89]" />
            <span>Facility Expense Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            Track electricity bills, rent, trainer payouts, AC servicing & cleaning costs.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] text-[#011812] hover:bg-[#00c97b] font-medium text-xs sm:text-sm h-11 px-4 gap-2 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Record New Expense
        </Button>
      </div>

      {/* STATS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Total Expenses This Month</span>
          <div className="mt-1 text-2xl font-normal text-rose-500">৳ {totalExpense.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Facility Rent</span>
          <div className="mt-1 text-2xl font-normal text-slate-900 dark:text-white">৳ {rentExpense.toLocaleString()}</div>
        </Card>

        <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">Electricity & Utility Bills</span>
          <div className="mt-1 text-2xl font-normal text-amber-500">৳ {utilityExpense.toLocaleString()}</div>
        </Card>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <Card className="p-4 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expense by description or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto flex-wrap">
          {['All', 'Rent', 'Electricity', 'Maintenance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setCategoryFilter(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                categoryFilter === tab
                  ? 'bg-[#00df89] text-[#011812]'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {/* TABLE */}
      <Card className="p-0 border border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-medium text-sm text-slate-900 dark:text-white">Logged Expenses</span>
          <Badge className="bg-rose-500/10 text-rose-500 text-xs font-normal">
            {filteredExpenses.length} Expense Logs
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-zinc-900/80 text-slate-500 font-normal uppercase text-[10px]">
              <tr>
                <th className="p-3.5 font-medium">Category</th>
                <th className="p-3.5 font-medium">Description</th>
                <th className="p-3.5 font-medium">Date</th>
                <th className="p-3.5 font-medium">Payment Method</th>
                <th className="p-3.5 text-right font-medium">Amount</th>
                <th className="p-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-slate-800 dark:text-zinc-200 font-normal">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40 transition-colors">
                  <td className="p-3.5">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {exp.category}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-medium text-slate-900 dark:text-white">{exp.title}</td>
                  <td className="p-3.5 font-mono">{exp.date}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-mono text-[11px]">
                      {exp.method}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-medium text-rose-500">৳ {exp.amount.toLocaleString()}</td>
                  <td className="p-3.5 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(exp.id)}
                      className="h-7 text-xs font-normal text-rose-500 dark:bg-zinc-900"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL */}
      <RecordExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecordExpense={handleRecordExpense}
      />

    </div>
  );
}
