import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

export default function Salary() {
  const { lang } = useLanguage();

  const [employees, setEmployees] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'বেতন বিতরণ ও পে-রোল খতিয়ান' : 'Salary Payouts & Payroll Register'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'মাসিক বেতন পরিশোধ ও হিস্ট্রি' : 'Disburse staff salaries, issue payment receipts and track monthly payroll'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'বেতন পরিশোধ করুন' : 'Disburse Salary'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Salary Outflow Recorded</div>
          <div className="text-2xl font-medium text-rose-500 mt-1">৳ {totalPaid.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Pay Slips Issued</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{history.length}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Registered Staff</div>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-1">{employees.length}</div>
        </Card>
      </div>

      {/* PAYROLL HISTORY TABLE */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
            Loading salary logs...
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
                {history.map((h) => (
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
