/**
 * @file GymExpenses.jsx
 * @description Gym operational expense tracker backed by MongoDB.
 */
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Plus, Calendar, FileText, Search, Trash2, Loader2 } from 'lucide-react';

import RecordExpenseModal from '@/components/gym/RecordExpenseModal';

export default function GymExpenses() {
  const { lang } = useLanguage();

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await api.expenses.list();
      if (res.data) {
        setExpenses(res.data);
      }
    } catch (err) {
      console.warn('Failed to load expenses from DB:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const rentExpense = expenses.filter(e => e.category === 'Rent').reduce((acc, e) => acc + (e.amount || 0), 0);
  const utilityExpense = expenses.filter(e => e.category === 'Electricity').reduce((acc, e) => acc + (e.amount || 0), 0);

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch =
      (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id) => {
    if (confirm('Delete this expense log?')) {
      try {
        await api.expenses.delete(id);
        fetchExpenses();
      } catch (err) {
        alert(err.message || 'Failed to delete expense.');
      }
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'সুবিধা ও অপারেশনাল খরচ' : 'Facility Expense Tracker'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'ভাড়া, বিদ্যুৎ বিল, ট্রেইনার বেতন ও মেশিন সার্ভিসিং খরচ' : 'Track electricity bills, rent, maintenance, cleaning & supplies'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন খরচ যুক্ত করুন' : 'Log New Expense'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Operational Outflow</div>
          <div className="text-2xl font-medium text-rose-500 mt-1">৳ {totalExpense.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Rent Payments</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">৳ {rentExpense.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Electricity & AC Bills</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">৳ {utilityExpense.toLocaleString()}</div>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'খরচের বিবরণ বা খাত খুঁজুন...' : 'Search expense title or note...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Rent', 'Electricity', 'Maintenance', 'Cleaning'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-zinc-800'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* EXPENSES LIST */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading expense logs...
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Expenses Recorded</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Log operational costs to balance your P&L accounting statement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Expense Title / Description</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Amount (৳)</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-normal">
                        {exp.category}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">{exp.title}</td>
                    <td className="p-3.5 text-slate-500">{new Date(exp.date).toISOString().split('T')[0]}</td>
                    <td className="p-3.5 font-medium text-rose-500">৳ {exp.amount.toLocaleString()}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(exp._id)}
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

      <RecordExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecordExpense={fetchExpenses}
      />

    </div>
  );
}
