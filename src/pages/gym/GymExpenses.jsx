/**
 * @file GymExpenses.jsx
 * @description Gym operational expense tracker backed by MongoDB.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/common/Pagination';
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

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        (e.title && e.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, pageSize]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredExpenses.slice(start, start + pageSize);
  }, [filteredExpenses, currentPage, pageSize]);

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
    <div className="space-y-6 font-sans pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'জিম অপারেটিং ব্যয় ও খরচ' : 'Facility Expenses & Outflows'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'বিদ্যুৎ বিল, ট্রেইনার বেতন, ভাড়া ও মেইন্টেনেন্স' : 'Rent, utility bills, machine servicing and coach payouts'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন খরচ যোগ করুন' : 'Record Expense'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Expenses</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-500 mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${totalExpense.toLocaleString()}`}
          </div>
          <div className="text-xs text-rose-500 mt-1">Recorded facility costs</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Facility Rent</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${rentExpense.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Floor & property lease</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Electricity & AC</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${utilityExpense.toLocaleString()}`}
          </div>
          <div className="text-xs text-slate-400 mt-1">Monthly energy overhead</div>
        </Card>
      </div>

      {/* SEARCH AND CATEGORIES */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'খরচ বা খাত খুঁজুন...' : 'Search expense title...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['All', 'Rent', 'Electricity', 'Maintenance', 'Salaries', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-[#00df89] text-[#011812] shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* EXPENSES TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading expenses...
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
                {paginatedExpenses.map((exp) => (
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

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredExpenses.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
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
