import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Plus, Phone, Mail, DollarSign, Calendar, Search, Trash2,
  Edit2, Loader2, X, CheckCircle2, ShieldCheck, Briefcase
} from 'lucide-react';

export default function Employees() {
  const { lang } = useLanguage();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Staff',
    salary: 20000,
    join_date: new Date().toISOString().split('T')[0],
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.employees.list();
      if (res.data) setEmployees(res.data);
    } catch (err) {
      console.warn('Failed to load employees:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    setIsSubmitting(true);
    try {
      await api.employees.create({
        ...form,
        salary: parseFloat(form.salary) || 0,
      });
      toast.success(lang === 'bn' ? 'কর্মী সফলভাবে যুক্ত করা হয়েছে!' : 'Employee registered successfully!');
      setIsModalOpen(false);
      setForm({
        name: '',
        phone: '',
        email: '',
        role: 'Staff',
        salary: 20000,
        join_date: new Date().toISOString().split('T')[0],
      });
      fetchEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to save employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm(lang === 'bn' ? 'কর্মীর তথ্য নিষ্ক্রিয় করতে চান?' : 'Deactivate employee record?')) {
      try {
        await api.employees.delete(id);
        toast.success(lang === 'bn' ? 'কর্মীর রেকর্ড মুছে ফেলা হয়েছে!' : 'Employee record deactivated.');
        fetchEmployees();
      } catch (err) {
        toast.error(err.message || 'Failed to delete employee.');
      }
    }
  };

  const filtered = employees.filter(e => {
    const q = searchTerm.toLowerCase();
    return e.name.toLowerCase().includes(q) || (e.role && e.role.toLowerCase().includes(q)) || (e.phone && e.phone.includes(q));
  });

  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (e.salary || 0), 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'কর্মকর্তা ও কর্মচারী তালিকা' : 'Staff & Employee Directory'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {lang === 'bn' ? 'কর্মচারী প্রোফাইল, মাসিক বেতন ও শিফট তথ্য' : 'Manage your retail shop or gym staff, roles, monthly salary & contact profiles'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-medium text-xs gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2]" />
          <span>{lang === 'bn' ? 'নতুন কর্মচারী যোগ করুন' : 'Add Employee'}</span>
        </Button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Active Staff</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">{employees.length}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Total Monthly Salary Payroll</div>
          <div className="text-2xl font-medium text-[#00a86b] dark:text-[#00df89] mt-1">৳ {totalMonthlyPayroll.toLocaleString()}</div>
        </Card>
        <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="text-xs text-slate-500 dark:text-zinc-400">Average Salary</div>
          <div className="text-2xl font-medium text-slate-900 dark:text-white mt-1">
            ৳ {employees.length > 0 ? Math.round(totalMonthlyPayroll / employees.length).toLocaleString() : 0}
          </div>
        </Card>
      </div>

      {/* SEARCH */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'bn' ? 'কর্মচারী খুঁজুন...' : 'Search by name, role or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
          />
        </div>
      </Card>

      {/* EMPLOYEES GRID */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
          Loading employees from database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">No Employees Found</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Add shop staff and managers to track monthly salary disbursements.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((e) => (
            <Card key={e._id} className="p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-medium text-base border border-emerald-500/20">
                  {e.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">{e.name}</h3>
                  <div className="text-xs text-[#00a86b] dark:text-[#00df89] font-normal">{e.role}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{e.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Salary: ৳ {(e.salary || 0).toLocaleString()} / month</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(e._id)}
                  className="text-xs text-rose-500 hover:text-rose-600 px-2"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Deactivate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-medium text-slate-900 dark:text-white">Add Staff / Employee</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shakil Mahmud"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01800-000000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Monthly Salary (৳)</label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
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
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Employee'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
