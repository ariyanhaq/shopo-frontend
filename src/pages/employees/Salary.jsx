import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/common/Pagination';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import {
  DollarSign, Plus, CheckCircle2, Search, Calendar,
  Wallet, FileText, Loader2, X, Briefcase
} from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export default function Salary() {
  const { lang } = useLanguage();

  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isModalOpen);

  const [payForm, setPayForm] = useState({
    employee_id: '',
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    amount: 20000,
    payment_method: 'bKash',
    note: 'Monthly salary disbursement',
  });

  const fetchData = async () => {
    try {
      const [empRes, histRes] = await Promise.all([
        api.employees.list(),
        api.employees.getSalaries(),
      ]);
      if (empRes.data) {
        setEmployees(empRes.data);
        if (empRes.data.length > 0 && !payForm.employee_id) {
          setPayForm(prev => ({
            ...prev,
            employee_id: empRes.data[0]._id,
            amount: empRes.data[0].salary,
          }));
        }
      }
      if (histRes.data) setHistory(histRes.data);
    } catch (err) {
      console.warn('Failed to load salary records:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisburse = async (e) => {
    e.preventDefault();
    if (!payForm.employee_id) return;

    setIsSubmitting(true);
    try {
      await api.employees.recordSalary({
        employee_id: payForm.employee_id,
        month: payForm.month,
        amount: parseFloat(payForm.amount) || 0,
        payment_method: payForm.payment_method,
        note: payForm.note,
      });

      toast.success(lang === 'bn' ? 'বেতন সফলভাবে পরিশোধ করা হয়েছে!' : 'Salary disbursed and recorded successfully!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record salary payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPaid = history.reduce((acc, h) => acc + (h.amount || 0), 0);
  const monthlyBudget = employees.reduce((acc, e) => acc + (e.salary || 0), 0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return history.slice(start, start + pageSize);
  }, [history, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>Staff Payroll & Salary Disbursement</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            Manage employee monthly payouts, payment vouchers, and staff ledger history.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Disburse Salary</span>
        </Button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট কর্মচারী' : 'Total Staff'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {isLoading ? <div className="h-7 sm:h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-16" /> : employees.length}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
              {lang === 'bn' ? 'সক্রিয় কর্মচারী' : 'Active staff'}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মোট বেতন প্রদান' : 'Salary Outflow'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-rose-500 tracking-tight truncate">
              {isLoading ? <div className="h-7 sm:h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${totalPaid.toLocaleString()}`}
            </div>
            <div className="text-[10px] sm:text-xs text-rose-500 font-medium truncate">
              {lang === 'bn' ? 'মোট বেতন খরচ' : 'Lifetime payroll'}
            </div>
          </div>
        </Card>

        <Card className="p-3.5 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] col-span-2 sm:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] sm:text-sm font-medium text-slate-500 dark:text-zinc-400 truncate">
              {lang === 'bn' ? 'মাসিক প্রক্ষেপণ' : 'Monthly Projected'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 space-y-1">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-500 tracking-tight truncate">
              {isLoading ? <div className="h-7 sm:h-8 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-24" /> : `৳ ${monthlyBudget.toLocaleString()}`}
            </div>
            <div className="text-[10px] sm:text-xs text-purple-500 font-medium truncate">
              {lang === 'bn' ? 'চলতি মাসের বাজেট' : 'Base monthly liability'}
            </div>
          </div>
        </Card>
      </div>

      {/* SALARY HISTORY TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-zinc-800/50 rounded animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Salary Payments Recorded Yet</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Use 'Disburse Salary' to record monthly staff payouts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="p-3.5">Employee Name</th>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Disbursement Date</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Note</th>
                  <th className="p-3.5 text-right">Amount Paid (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedHistory.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50 dark:hover:bg-zinc-900/40">
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {h.employee_id?.name || 'Staff Member'}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-zinc-300">{h.month}</td>
                    <td className="p-3.5 text-slate-500">{new Date(h.payment_date || h.created_at).toLocaleString()}</td>
                    <td className="p-3.5">
                      <Badge variant="default" className="text-[10px] capitalize">
                        {h.payment_method}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500">{h.note || '-'}</td>
                    <td className="p-3.5 text-right font-medium text-rose-500">
                      ৳ {(h.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalItems={history.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* DISBURSE SALARY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">Disburse Salary Payment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Employee *</label>
                <Select
                  value={payForm.employee_id}
                  onValueChange={(val) => {
                    const emp = employees.find(emp => emp._id === val);
                    setPayForm({
                      ...payForm,
                      employee_id: val,
                      amount: emp ? emp.salary : payForm.amount,
                    });
                  }}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name} ({emp.role}) — ৳ {emp.salary}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Salary Month</label>
                  <input
                    type="text"
                    value={payForm.month}
                    onChange={(e) => setPayForm({ ...payForm, month: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Amount (৳)</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <Select
                  value={payForm.payment_method}
                  onValueChange={(val) => setPayForm({ ...payForm, payment_method: val })}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-[#09090b]">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bKash">bKash</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block font-medium mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
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
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Salary Payout'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
