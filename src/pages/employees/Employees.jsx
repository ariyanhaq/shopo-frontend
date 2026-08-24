/**
 * @file Employees.jsx
 * @description Master Staff & Employee Directory with comprehensive Salary & Payroll Dispatcher, Working Hours, Bonus, Days Worked tracking, and printable Pay Vouchers.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  Users, Plus, Phone, Mail, DollarSign, Calendar, Search, Trash2,
  Edit2, Loader2, X, CheckCircle2, ShieldCheck, Briefcase, Clock,
  Award, Sparkles, Receipt, Printer, FileText, Banknote, CreditCard,
  Building2, UserCheck, AlertCircle, Eye, History, Check, ArrowRight,
  ChevronRight
} from 'lucide-react';

const DEPARTMENTS = ['General', 'Sales', 'Management', 'Inventory', 'Logistics', 'Accounts'];
const PAYMENT_METHODS = ['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Card'];

const safeMoney = (val, fallback = 0) => {
  const n = Number(val);
  return isNaN(n) ? fallback.toLocaleString() : n.toLocaleString();
};

const safeDate = (val) => {
  if (!val) return 'N/A';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
};

export default function Employees() {
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'payroll'
  const [employees, setEmployees] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [stats, setStats] = useState({
    total_employees: 0,
    total_monthly_payroll: 0,
    total_paid_this_month: 0,
    pending_payroll: 0,
    average_salary: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deactivate Confirm
  const [confirmDeactivate, setConfirmDeactivate] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useBodyScrollLock(
    Boolean(
      isAddModalOpen ||
      isEditModalOpen ||
      isPayModalOpen ||
      selectedPaySlip ||
      confirmDeactivate.isOpen
    )
  );

  // Employee Form
  const [empForm, setEmpForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Sales Associate',
    department: 'Sales',
    salary: 18000,
    working_hours: '8 hrs/day (9:00 AM - 5:00 PM)',
    work_days: '6 days/week',
    joining_date: new Date().toISOString().split('T')[0],
    nid: '',
    address: '',
    emergency_contact: '',
    bank_details: '',
    status: 'Active',
  });

  // Salary Payment Form
  const [payForm, setPayForm] = useState({
    employee_id: '',
    employee_name: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    days_worked: 30,
    working_hours: '8 hrs/day',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const fetchEmployeesAndPayroll = async () => {
    setIsLoading(true);
    try {
      const [empRes, salRes] = await Promise.all([
        api.employees.list(),
        api.employees.getSalaries(),
      ]);

      const empDocs = Array.isArray(empRes?.data)
        ? empRes.data
        : Array.isArray(empRes?.data?.docs)
        ? empRes.data.docs
        : [];
      setEmployees(empDocs);

      if (empRes?.data?.stats) {
        setStats(empRes.data.stats);
      } else if (empRes?.stats) {
        setStats(empRes.stats);
      } else {
        const totalMonthlyPayroll = empDocs.reduce((acc, e) => acc + (Number(e.salary) || 0), 0);
        setStats({
          total_employees: empDocs.length,
          total_monthly_payroll: totalMonthlyPayroll,
          total_paid_this_month: 0,
          pending_payroll: totalMonthlyPayroll,
          average_salary: empDocs.length > 0 ? Math.round(totalMonthlyPayroll / empDocs.length) : 0,
        });
      }

      const salDocs = Array.isArray(salRes?.data) ? salRes.data : [];
      setSalaryHistory(salDocs);
    } catch (err) {
      console.warn('Failed to load employees & salary data:', err.message);
      toast.error('Failed to load employee records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndPayroll();
  }, []);

  // Open Add Employee Modal
  const handleOpenAdd = () => {
    setEmpForm({
      name: '',
      phone: '',
      email: '',
      role: 'Sales Associate',
      department: 'Sales',
      salary: 18000,
      working_hours: '8 hrs/day (9:00 AM - 5:00 PM)',
      work_days: '6 days/week',
      joining_date: new Date().toISOString().split('T')[0],
      nid: '',
      address: '',
      emergency_contact: '',
      bank_details: '',
      status: 'Active',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Employee Modal
  const handleOpenEdit = (emp) => {
    setCurrentEmployee(emp);
    setEmpForm({
      name: emp.name || '',
      phone: emp.phone || '',
      email: emp.email || '',
      role: emp.role || 'Staff',
      department: emp.department || 'General',
      salary: emp.salary || 0,
      working_hours: emp.working_hours || '8 hrs/day (9:00 AM - 5:00 PM)',
      work_days: emp.work_days || '6 days/week',
      joining_date: emp.joining_date || new Date().toISOString().split('T')[0],
      nid: emp.nid || '',
      address: emp.address || '',
      emergency_contact: emp.emergency_contact || '',
      bank_details: emp.bank_details || '',
      status: emp.status || 'Active',
    });
    setIsEditModalOpen(true);
  };

  // Open Pay Salary Modal
  const handleOpenPaySalary = (emp = null) => {
    const targetEmp = emp || employees[0];
    if (!targetEmp) {
      toast.error(lang === 'bn' ? 'কোনো কর্মী নেই।' : 'No employee available to pay salary.');
      return;
    }

    setPayForm({
      employee_id: targetEmp._id,
      employee_name: targetEmp.name,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      base_salary: targetEmp.salary || 0,
      bonus: 0,
      deductions: 0,
      days_worked: 30,
      working_hours: targetEmp.working_hours || '8 hrs/day',
      payment_method: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      note: `Monthly salary for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    });
    setIsPayModalOpen(true);
  };

  const handleSelectPayEmployee = (empId) => {
    const emp = employees.find((e) => e._id === empId);
    if (emp) {
      setPayForm((prev) => ({
        ...prev,
        employee_id: emp._id,
        employee_name: emp.name,
        base_salary: emp.salary || 0,
        working_hours: emp.working_hours || '8 hrs/day',
      }));
    }
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!empForm.name.trim() || !empForm.phone.trim()) {
      toast.error(lang === 'bn' ? 'কর্মীর নাম ও মোবাইল নম্বর আবশ্যক।' : 'Name and phone are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.employees.create({
        ...empForm,
        salary: parseFloat(empForm.salary) || 0,
      });

      toast.success(lang === 'bn' ? 'কর্মকর্তা/কর্মচারী সফলভাবে যুক্ত হয়েছে!' : 'Employee registered successfully!');
      setIsAddModalOpen(false);
      fetchEmployeesAndPayroll();
    } catch (err) {
      toast.error(err.message || 'Failed to save employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!currentEmployee || !empForm.name.trim() || !empForm.phone.trim()) return;

    setIsSubmitting(true);
    try {
      await api.employees.update(currentEmployee._id, {
        ...empForm,
        salary: parseFloat(empForm.salary) || 0,
      });

      toast.success(lang === 'bn' ? 'কর্মীর তথ্য আপডেট হয়েছে!' : 'Employee updated successfully!');
      setIsEditModalOpen(false);
      setCurrentEmployee(null);
      fetchEmployeesAndPayroll();
    } catch (err) {
      toast.error(err.message || 'Failed to update employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPaySalary = async (e) => {
    e.preventDefault();
    if (!payForm.employee_id) return;

    setIsSubmitting(true);
    try {
      const res = await api.employees.recordSalary({
        ...payForm,
        base_salary: parseFloat(payForm.base_salary) || 0,
        bonus: parseFloat(payForm.bonus) || 0,
        deductions: parseFloat(payForm.deductions) || 0,
        days_worked: parseInt(payForm.days_worked) || 30,
      });

      const netAmount = Math.max(
        0,
        (parseFloat(payForm.base_salary) || 0) +
        (parseFloat(payForm.bonus) || 0) -
        (parseFloat(payForm.deductions) || 0)
      );

      toast.success(
        lang === 'bn'
          ? `বেতন সফলভাবে পরিশোধ হয়েছে! মোট: ৳${netAmount.toLocaleString()}`
          : `Salary payment recorded! Net Paid: ৳${netAmount.toLocaleString()}`
      );

      setIsPayModalOpen(false);
      if (res?.data) {
        setSelectedPaySlip(res.data);
      }
      fetchEmployeesAndPayroll();
    } catch (err) {
      toast.error(err.message || 'Failed to record salary payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDeactivate.id) return;
    setIsDeleting(true);
    try {
      await api.employees.delete(confirmDeactivate.id);
      toast.success(lang === 'bn' ? 'কর্মীর অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।' : 'Employee deactivated.');
      setConfirmDeactivate({ isOpen: false, id: null, name: '' });
      fetchEmployeesAndPayroll();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate employee.');
    } finally {
      setIsDeleting(false);
    }
  };

  const modalNetPay = useMemo(() => {
    const b = parseFloat(payForm.base_salary) || 0;
    const bon = parseFloat(payForm.bonus) || 0;
    const ded = parseFloat(payForm.deductions) || 0;
    return Math.max(0, b + bon - ded);
  }, [payForm.base_salary, payForm.bonus, payForm.deductions]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.phone && e.phone.includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.department && e.department.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' || e.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [employees, searchQuery, statusFilter]);

  // Directory Pagination
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);

  useEffect(() => {
    setEmpPage(1);
  }, [searchQuery, statusFilter, empPageSize]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empPageSize;
    return filteredEmployees.slice(start, start + empPageSize);
  }, [filteredEmployees, empPage, empPageSize]);

  // Payroll History Pagination
  const [payPage, setPayPage] = useState(1);
  const [payPageSize, setPayPageSize] = useState(10);

  const paginatedSalaryHistory = useMemo(() => {
    const start = (payPage - 1) * payPageSize;
    return salaryHistory.slice(start, start + payPageSize);
  }, [salaryHistory, payPage, payPageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'কর্মচারী ও বেতন ব্যবস্থাপনা' : 'Staff Directory & Payroll'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'কর্মীদের দৈনিক কাজের সময়, কাজের দিন, মাসিক বেতন, বোনাস ও স্যালারি ভাউচার হিসাব'
              : 'Manage employee profiles, daily working hours, salary payroll, bonus incentives and vouchers.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenPaySalary()}
            disabled={employees.length === 0}
            className="h-10 px-4 text-xs sm:text-sm font-semibold border-emerald-500/30 text-emerald-700 dark:text-[#00df89] hover:bg-emerald-500/10 gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4" />
            <span>{lang === 'bn' ? 'বেতন দিন' : 'Pay Salary'}</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন কর্মচারী যোগ করুন' : 'Add Employee'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI STAT CARDS                                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Active Staff</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : employees.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Employed members</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Monthly Payroll Obligation</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-28 my-0.5" /> : `৳ ${safeMoney(stats.total_monthly_payroll)}`}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">Base monthly salary</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Salaries Paid This Month</span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${safeMoney(stats.total_paid_this_month)}`}
          </div>
          <div className="text-xs text-purple-500 mt-1">{new Date().toLocaleString('default', { month: 'long' })} disbursed</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Average Staff Salary</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : `৳ ${safeMoney(stats.average_salary)}`}
          </div>
          <div className="text-xs text-slate-500 mt-1">Per employee</div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'নাম, পদবি বা মোবাইল নম্বর খুঁজুন...' : 'Search by name, role or phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="w-full sm:w-48">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full h-9.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                <SelectValue placeholder={lang === 'bn' ? 'কর্মী তালিকা' : 'Staff Directory'} />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                <SelectItem value="directory">
                  {lang === 'bn' ? 'কর্মী তালিকা' : 'Staff Directory'}
                </SelectItem>
                <SelectItem value="payroll">
                  {lang === 'bn' ? 'বেতন হিস্ট্রি' : 'Salary History'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ==================================================== */}
      {/* TAB 1: STAFF DIRECTORY TABLE                         */}
      {/* ==================================================== */}
      {activeTab === 'directory' && (
        <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {lang === 'bn' ? 'কোনো কর্মী পাওয়া যায়নি' : 'No Employees Found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn' ? 'নতুন কর্মচারী যোগ করতে উপরের বাটনে ক্লিক করুন।' : 'Add your shop staff, cashiers and managers.'}
              </p>
              <Button size="sm" onClick={handleOpenAdd} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
                <Plus className="w-3.5 h-3.5 mr-1" />
                {lang === 'bn' ? 'নতুন কর্মী যোগ করুন' : 'Add Employee'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 font-medium">
                    <th className="p-3.5 pl-4 sm:pl-6 text-xs font-semibold">{lang === 'bn' ? 'কর্মী ও পদবি' : 'Employee & Role'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'মোবাইল ও ইমেইল' : 'Contact Details'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'কাজের সময় ও দিন' : 'Work Hours & Shift'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'মাসিক বেতন' : 'Base Salary'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="p-3.5 pr-4 sm:pr-6 text-xs font-semibold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {paginatedEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-4 sm:pl-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-bold text-xs border border-emerald-500/20 shrink-0">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-[#00a86b] dark:text-[#00df89] font-medium">{emp.role || 'Staff'}</span>
                              <span>•</span>
                              <span>{emp.department || 'General'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                        {emp.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate max-w-48">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{emp.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs">
                        <div className="font-medium text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{emp.working_hours || '8 hrs/day'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {emp.work_days || '6 days/week'}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-bold text-[#00a86b] dark:text-[#00df89] text-xs font-mono">
                        ৳ {safeMoney(emp.salary)} / mo
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-bold ${
                            emp.status === 'Active'
                              ? 'bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {emp.status || 'Active'}
                        </Badge>
                      </td>

                      <td className="p-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPaySalary(emp)}
                            title={lang === 'bn' ? 'বেতন পরিশোধ করুন' : 'Pay Salary'}
                            className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            <Banknote className="w-4 h-4 stroke-[2]" />
                            <span>{lang === 'bn' ? 'বেতন দিন' : 'Pay Salary'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(emp)}
                            title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Details'}
                            className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/20 shadow-2xs shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmDeactivate({
                                isOpen: true,
                                id: emp._id,
                                name: emp.name,
                              })
                            }
                            title={lang === 'bn' ? 'নিষ্ক্রিয় / মুছে ফেলুন' : 'Deactivate Employee'}
                            className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors cursor-pointer border border-rose-500/20 shadow-2xs shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Directory Pagination */}
              <Pagination
                currentPage={empPage}
                totalItems={filteredEmployees.length}
                pageSize={empPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                onPageChange={setEmpPage}
                onPageSizeChange={setEmpPageSize}
              />
            </div>
          )}
        </Card>
      )}

      {/* ==================================================== */}
      {/* TAB 2: SALARY & PAYROLL HISTORY                      */}
      {/* ==================================================== */}
      {activeTab === 'payroll' && (
        <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
          {salaryHistory.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Receipt className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {lang === 'bn' ? 'কোনো বেতন পরিশোধের ইতিহাস নেই' : 'No Salary Disbursements Found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {lang === 'bn' ? '"বেতন দিন" বাটনে ক্লিক করে প্রথম পে-রোল তৈরি করুন।' : 'Record a salary payment to see slips and disbursement history.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/90 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 font-medium">
                    <th className="p-3.5 pl-4 sm:pl-6 text-xs font-semibold">{lang === 'bn' ? 'তারিখ ও ভাউচার' : 'Date & Voucher'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'কর্মীর নাম' : 'Employee Name'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'বেতনের মাস' : 'Salary Month'}</th>
                    <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'কাজের দিন' : 'Days Worked'}</th>
                    <th className="p-3.5 text-xs font-semibold text-right">{lang === 'bn' ? 'মূল বেতন' : 'Base Salary'}</th>
                    <th className="p-3.5 text-xs font-semibold text-right">{lang === 'bn' ? 'বোনাস (+)' : 'Bonus (+)'}</th>
                    <th className="p-3.5 text-xs font-semibold text-right">{lang === 'bn' ? 'কর্তন (-)' : 'Deductions (-)'}</th>
                    <th className="p-3.5 text-xs font-semibold text-right">{lang === 'bn' ? 'পরিশোধিত মোট' : 'Net Paid'}</th>
                    <th className="p-3.5 pr-4 sm:pr-6 text-xs font-semibold text-right">{lang === 'bn' ? 'স্লিপ' : 'Pay Slip'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {paginatedSalaryHistory.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-4 sm:pl-6 whitespace-nowrap text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {safeDate(p.payment_date)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {p.reference_no || 'SAL-0000'}
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {p.employee_name}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/20"
                        >
                          {p.month} {p.year || ''}
                        </Badge>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs text-slate-500">
                        <div className="font-semibold text-slate-700 dark:text-zinc-300">
                          {p.days_worked || 30} {lang === 'bn' ? 'দিন' : 'days'}
                        </div>
                        <div className="text-[10px] text-slate-400">{p.working_hours || '8 hrs/day'}</div>
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-600 dark:text-zinc-400 text-xs">
                        ৳ {safeMoney(p.base_salary)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-emerald-600 font-semibold text-xs">
                        {p.bonus > 0 ? `+ ৳ ${safeMoney(p.bonus)}` : '—'}
                      </td>

                      <td className="p-3.5 text-right font-mono text-rose-500 font-semibold text-xs">
                        {p.deductions > 0 ? `- ৳ ${safeMoney(p.deductions)}` : '—'}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-[#00a86b] dark:text-[#00df89] text-xs whitespace-nowrap">
                        ৳ {safeMoney(p.net_paid)}
                      </td>

                      <td className="p-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedPaySlip(p)}
                          title={lang === 'bn' ? 'বেতন ভাউচার স্লিপ দেখুন' : 'View Salary Voucher Slip'}
                          className="h-8 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'ভাউচার' : 'View Slip'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Payroll History Pagination */}
              <Pagination
                currentPage={payPage}
                totalItems={salaryHistory.length}
                pageSize={payPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                onPageChange={setPayPage}
                onPageSizeChange={setPayPageSize}
              />
            </div>
          )}
        </Card>
      )}

      {/* ---------------------------------------------------- */}
      {/* PAY SALARY MODAL                                     */}
      {/* ---------------------------------------------------- */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'বেতন পরিশোধ করুন' : 'Disburse Employee Salary'}
              </h2>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPaySalary} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'কর্মচারী নির্বাচন করুন *' : 'Select Employee *'}
                </label>
                <Select
                  value={payForm.employee_id}
                  onValueChange={handleSelectPayEmployee}
                >
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                    <SelectValue placeholder="Select Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp._id} value={emp._id}>
                        {emp.name} ({emp.role || 'Staff'}) — Base: ৳{safeMoney(emp.salary)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বেতনের মাস *' : 'Salary Month *'}
                  </label>
                  <Select
                    value={payForm.month}
                    onValueChange={(val) => setPayForm({ ...payForm, month: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বছর' : 'Year'}
                  </label>
                  <input
                    type="number"
                    value={payForm.year}
                    onChange={(e) => setPayForm({ ...payForm, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'কাজের দিন (উপস্থিতি)' : 'Days Worked (Attendance)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={payForm.days_worked}
                    onChange={(e) => setPayForm({ ...payForm, days_worked: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'কাজের শিফট/সময়' : 'Working Hours / Shift'}
                  </label>
                  <input
                    type="text"
                    value={payForm.working_hours}
                    onChange={(e) => setPayForm({ ...payForm, working_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300 text-[11px]">
                      {lang === 'bn' ? 'মূল বেতন (৳)' : 'Base Salary (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={payForm.base_salary}
                      onChange={(e) => setPayForm({ ...payForm, base_salary: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 font-mono text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-emerald-600 text-[11px]">
                      {lang === 'bn' ? 'বোনাস (+) (৳)' : 'Bonus (+) (৳)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={payForm.bonus}
                      onChange={(e) => setPayForm({ ...payForm, bonus: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 font-mono text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium mb-1 text-rose-500 text-[11px]">
                      {lang === 'bn' ? 'কর্তন (-) (৳)' : 'Deductions (-)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={payForm.deductions}
                      onChange={(e) => setPayForm({ ...payForm, deductions: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-700 font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    {lang === 'bn' ? 'সর্বমোট প্রদেয় বেতন:' : 'Net Payable Amount:'}
                  </span>
                  <span className="text-base font-bold font-mono text-[#00a86b] dark:text-[#00df89]">
                    ৳ {safeMoney(modalNetPay)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <Select
                    value={payForm.payment_method}
                    onValueChange={(val) => setPayForm({ ...payForm, payment_method: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পরিশোধের তারিখ' : 'Payment Date'}
                  </label>
                  <input
                    type="date"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'মন্তব্য / নোট' : 'Remarks / Note'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full via cash"
                  value={payForm.note}
                  onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPayModalOpen(false)}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    lang === 'bn' ? 'বেতন পরিশোধ নিশ্চিত করুন' : 'Confirm Payout'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD / EDIT EMPLOYEE MODAL                            */}
      {/* ---------------------------------------------------- */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditModalOpen
                  ? (lang === 'bn' ? 'কর্মীর তথ্য পরিবর্তন' : 'Edit Staff Profile')
                  : (lang === 'bn' ? 'নতুন কর্মচারী যোগ করুন' : 'Add New Employee')}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleSaveEdit : handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'কর্মীর পূর্ণ নাম *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shakil Mahmud"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01800-000000"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পদবি / রোল' : 'Designation / Role'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Store Manager, Cashier"
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'বিভাগ (Department)' : 'Department'}
                  </label>
                  <Select
                    value={empForm.department}
                    onValueChange={(val) => setEmpForm({ ...empForm, department: val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'মাসিক মূল বেতন (৳) *' : 'Monthly Base Salary (৳) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="20000"
                    value={empForm.salary}
                    onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'দৈনিক কাজের সময়' : 'Working Hours'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8 hrs/day"
                    value={empForm.working_hours}
                    onChange={(e) => setEmpForm({ ...empForm, working_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'সাপ্তাহিক কাজের দিন' : 'Work Days'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 6 days/week"
                    value={empForm.work_days}
                    onChange={(e) => setEmpForm({ ...empForm, work_days: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'যোগদানের তারিখ' : 'Joining Date'}
                  </label>
                  <input
                    type="date"
                    value={empForm.joining_date}
                    onChange={(e) => setEmpForm({ ...empForm, joining_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    placeholder="employee@mail.com"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ব্যাংক / বিকাশ অ্যাকাউন্ট' : 'Bank / MFS Account'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. bKash: 01700-000000"
                    value={empForm.bank_details}
                    onChange={(e) => setEmpForm({ ...empForm, bank_details: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}
                  </label>
                  <input
                    type="text"
                    placeholder="199XXXXXXXX"
                    value={empForm.nid}
                    onChange={(e) => setEmpForm({ ...empForm, nid: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'ঠিকানা' : 'Address'}
                </label>
                <input
                  type="text"
                  placeholder="House, Road, City"
                  value={empForm.address}
                  onChange={(e) => setEmpForm({ ...empForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isEditModalOpen ? (
                    lang === 'bn' ? 'আপডেট করুন' : 'Update Employee'
                  ) : (
                    lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Employee'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SALARY SLIP / PAY VOUCHER MODAL                      */}
      {/* ---------------------------------------------------- */}
      {selectedPaySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'অফিসিয়াল স্যালারি ভাউচার' : 'Official Salary Slip'}
                </h2>
                <p className="text-xs text-slate-400 font-mono">{selectedPaySlip.reference_no || 'SAL-0000'}</p>
              </div>
              <button
                onClick={() => setSelectedPaySlip(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 space-y-3.5 text-xs">
              <div className="text-center pb-3 border-b border-slate-200 dark:border-zinc-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{mongoShop?.name || 'Shopo Store'}</h3>
                <p className="text-[11px] text-slate-400">
                  {lang === 'bn' ? 'বেতন মাস:' : 'Salary for:'} {selectedPaySlip.month} {selectedPaySlip.year || ''}
                </p>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-[#00df89] border-emerald-500/30 text-[10px] font-bold mt-1">
                  PAID SALARY VOUCHER
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'কর্মীর নাম:' : 'Employee Name:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedPaySlip.employee_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'কাজের দিন:' : 'Days Worked:'}</span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {selectedPaySlip.days_worked || 30} days ({selectedPaySlip.working_hours || '8 hrs/day'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-semibold uppercase">{selectedPaySlip.payment_method || 'Cash'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                  <span>{safeDate(selectedPaySlip.payment_date)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>{lang === 'bn' ? 'মূল বেতন:' : 'Base Salary:'}</span>
                    <span className="font-mono">৳ {safeMoney(selectedPaySlip.base_salary)}</span>
                  </div>
                  {selectedPaySlip.bonus > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>{lang === 'bn' ? 'বোনাস (+):' : 'Bonus (+):'}</span>
                      <span className="font-mono">+ ৳ {safeMoney(selectedPaySlip.bonus)}</span>
                    </div>
                  )}
                  {selectedPaySlip.deductions > 0 && (
                    <div className="flex justify-between text-rose-500 font-medium">
                      <span>{lang === 'bn' ? 'কর্তন (-):' : 'Deductions (-):'}</span>
                      <span className="font-mono">- ৳ {safeMoney(selectedPaySlip.deductions)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>{lang === 'bn' ? 'মোট পরিশোধিত বেতন:' : 'Net Paid:'}</span>
                  <span className="text-[#00a86b] dark:text-[#00df89] font-mono text-base font-bold">
                    ৳ {safeMoney(selectedPaySlip.net_paid)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-400">
                <div className="border-t border-slate-300 dark:border-zinc-700 pt-1">
                  {lang === 'bn' ? 'কর্তৃপক্ষের স্বাক্ষর' : 'Authorized Signature'}
                </div>
                <div className="border-t border-slate-300 dark:border-zinc-700 pt-1">
                  {lang === 'bn' ? 'কর্মীর স্বাক্ষর' : "Employee's Signature"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedPaySlip(null)} className="cursor-pointer">
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> {lang === 'bn' ? 'ভাউচার প্রিন্ট' : 'Print Slip'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DEACTIVATE DIALOG                            */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDeactivate.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `'${confirmDeactivate.name}' কর্মীকে নিষ্ক্রিয় করতে চান?` : `Deactivate employee '${confirmDeactivate.name}'?`}
        description={lang === 'bn' ? 'এই কর্মীর প্রোফাইল নিষ্ক্রিয় করা হবে তবে পূর্বের বেতন হিস্ট্রি সংরক্ষিত থাকবে।' : 'This employee profile will be deactivated. Historical salary payouts will be preserved.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, নিষ্ক্রিয় করুন' : 'Yes, Deactivate'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmDeactivate({ isOpen: false, id: null, name: '' })}
      />

    </div>
  );
}
