/**
 * @file Users.jsx
 * @description Comprehensive Store Users & Role-Based Access Control (RBAC) management with Firebase Auth, Email Verification, and granular module permissions.
 */
import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';
import { firebaseConfig } from '@/firebase.config';
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
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  ShieldCheck, Plus, Search, Trash2, Edit2, Loader2, X,
  CheckCircle2, UserCog, Mail, Phone, Lock, Eye, EyeOff,
  ShoppingCart, Store, Package, ShoppingBag, Building2,
  Users as UsersIcon, CreditCard, DollarSign, UserCheck,
  BarChart3, Settings, Check, Sparkles, KeyRound, AlertCircle,
  Send, RefreshCw, Clock, RotateCw
} from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  {
    id: 'orders',
    nameEn: 'Orders & Sales',
    nameBn: 'বিক্রয় ও ইনভয়েস',
    descEn: 'Create and view sales orders, invoices & returns',
    icon: ShoppingCart,
  },
  {
    id: 'pos',
    nameEn: 'POS & Billing',
    nameBn: 'পিওএস ও ক্যাশ কাউন্টার',
    descEn: 'Access POS terminal for fast barcode checkout',
    icon: Store,
  },
  {
    id: 'products',
    nameEn: 'Products & Inventory',
    nameBn: 'পণ্য ও স্টক',
    descEn: 'Add, edit, and manage product inventory & barcodes',
    icon: Package,
  },
  {
    id: 'purchases',
    nameEn: 'Purchases & Stock-In',
    nameBn: 'পণ্য ক্রয় ও স্টক ইন',
    descEn: 'Record supplier purchases and incoming inventory',
    icon: ShoppingBag,
  },
  {
    id: 'suppliers',
    nameEn: 'Suppliers Directory',
    nameBn: 'সাপ্লায়ার ও মহাজন',
    descEn: 'Manage supplier accounts and balance ledgers',
    icon: Building2,
  },
  {
    id: 'customers',
    nameEn: 'Customers & Dues',
    nameBn: 'কাস্টমার ও গ্রাহক',
    descEn: 'Manage customer profiles and bakeya khata dues',
    icon: UsersIcon,
  },
  {
    id: 'payments',
    nameEn: 'Payments & Collections',
    nameBn: 'পেমেন্ট ও বকেয়া গ্রহণ',
    descEn: 'Collect customer dues and record debit/credit transactions',
    icon: CreditCard,
  },
  {
    id: 'employees',
    nameEn: 'Staff & Payroll',
    nameBn: 'কর্মচারী ও বেতন',
    descEn: 'Manage employee profiles, hours, and pay salary slips',
    icon: UserCheck,
  },
  {
    id: 'expenses',
    nameEn: 'Business Expenses',
    nameBn: 'দোকানের খরচ',
    descEn: 'Record operational costs, rent, utilities and vouchers',
    icon: DollarSign,
  },
  {
    id: 'accounting',
    nameEn: 'Accounting & Reports',
    nameBn: 'আর্থিক হিসাব ও রিপোর্ট',
    descEn: 'View financial balance sheets, profit & loss summaries',
    icon: BarChart3,
  },
  {
    id: 'settings',
    nameEn: 'Store Settings',
    nameBn: 'দোকান কনফিগারেশন',
    descEn: 'Edit shop profile, business info, tax and invoice terms',
    icon: Settings,
  },
];

const ROLE_PRESETS = {
  manager: {
    labelEn: 'Store Manager',
    labelBn: 'ম্যানেজার',
    permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
  },
  cashier: {
    labelEn: 'Cashier / POS Operator',
    labelBn: 'ক্যাশিয়ার',
    permissions: ['orders', 'pos', 'customers', 'payments'],
  },
  staff: {
    labelEn: 'Sales Staff',
    labelBn: 'সেলস স্টাফ',
    permissions: ['orders', 'pos', 'products'],
  },
  custom: {
    labelEn: 'Custom Role',
    labelBn: 'কাস্টম পারমিশন',
    permissions: ['orders', 'pos'],
  },
};

const safeDate = (val) => {
  if (!val) return 'Recently';
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
};

export default function Users() {
  const { lang } = useLanguage();
  const { mongoShop, currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    managers: 0,
    cashiers: 0,
    staff: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkingUserId, setCheckingUserId] = useState(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  useBodyScrollLock(
    Boolean(
      isAddModalOpen ||
      isEditModalOpen ||
      confirmDelete.isOpen
    )
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'cashier',
    permissions: ROLE_PRESETS.cashier.permissions,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.users.list();
      const docs = Array.isArray(res?.data?.users)
        ? res.data.users
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setUsers(docs);

      if (res?.data?.stats) {
        setStats(res.data.stats);
      } else {
        const managers = docs.filter((u) => u.role === 'manager' || u.role === 'owner').length;
        const cashiers = docs.filter((u) => u.role === 'cashier').length;
        const staff = docs.filter((u) => u.role === 'staff' || u.role === 'employee' || u.role === 'custom').length;
        setStats({
          total_users: docs.length,
          managers,
          cashiers,
          staff,
        });
      }
    } catch (err) {
      console.warn('Failed to load store users:', err.message);
      toast.error('Failed to load store users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'cashier',
      permissions: ROLE_PRESETS.cashier.permissions,
    });
    setShowPassword(false);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'staff',
      permissions: Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : ROLE_PRESETS[user.role]?.permissions || ['orders', 'pos'],
    });
    setShowPassword(false);
    setIsEditModalOpen(true);
  };

  const handleRoleChange = (newRole) => {
    const preset = ROLE_PRESETS[newRole];
    setForm((prev) => ({
      ...prev,
      role: newRole,
      permissions: preset ? preset.permissions : prev.permissions,
    }));
  };

  const handleTogglePermission = (permId) => {
    setForm((prev) => {
      const exists = prev.permissions.includes(permId);
      const updated = exists
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId];
      return {
        ...prev,
        permissions: updated,
        role: prev.role === 'manager' && updated.length < AVAILABLE_PERMISSIONS.length ? 'custom' : prev.role,
      };
    });
  };

  const handleSelectAllPermissions = () => {
    setForm((prev) => ({
      ...prev,
      permissions: AVAILABLE_PERMISSIONS.map((p) => p.id),
      role: 'manager',
    }));
  };

  const handleDeselectAllPermissions = () => {
    setForm((prev) => ({
      ...prev,
      permissions: [],
      role: 'custom',
    }));
  };

  // Create user using Firebase Web SDK + Email Verification + MongoDB link
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    const cleanEmail = form.email.toLowerCase().trim();
    const cleanName = form.name.trim();

    if (!cleanName || !cleanEmail) {
      toast.error(lang === 'bn' ? 'নাম ও ইমেইল আবশ্যক।' : 'Name and email are required.');
      return;
    }

    if (!form.password || form.password.length < 6) {
      toast.error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    // Pre-check if email is already in the current store users table
    const isAlreadyInList = users.some((u) => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (isAlreadyInList) {
      toast.error(
        lang === 'bn'
          ? 'এই ইমেইলটি ইতিমধ্যে এই দোকানে যুক্ত রয়েছে। নতুন ব্যবহারকারী তৈরি করতে অব্যবহৃত (Fresh) ইমেইল ব্যবহার করুন।'
          : 'This email already exists in this store. Please use a fresh, unused email address.'
      );
      return;
    }

    setIsSubmitting(true);
    let firebaseUid = null;
    let emailVerificationSent = false;
    let secondaryApp = null;

    // Use an isolated secondary Firebase app to create the user account without logging out the current admin
    const secondaryAppName = `UserCreationApp_${Date.now()}`;
    try {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const userCred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, form.password);
        firebaseUid = userCred.user.uid;

        await updateProfile(userCred.user, { displayName: cleanName });
        await sendEmailVerification(userCred.user);
        emailVerificationSent = true;

        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        secondaryApp = null;
      } catch (innerFbErr) {
        if (secondaryApp) {
          try { await deleteApp(secondaryApp); } catch (e) {}
          secondaryApp = null;
        }

        if (innerFbErr.code === 'auth/email-already-in-use') {
          toast.error(
            lang === 'bn'
              ? 'এই ইমেইলটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে। নতুন ব্যবহারকারী যোগ করতে অব্যবহৃত (Fresh) ইমেইল দিন।'
              : 'This email is already registered. Please use a fresh, unused email address.'
          );
          setIsSubmitting(false);
          return;
        } else if (innerFbErr.code === 'auth/weak-password') {
          toast.error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password is too weak. Use at least 6 characters.');
          setIsSubmitting(false);
          return;
        } else {
          toast.error(innerFbErr.message || 'Firebase user creation failed.');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (fbErr) {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (e) {}
      }
      toast.error(fbErr.message || 'Firebase account creation failed.');
      setIsSubmitting(false);
      return;
    }

    try {
      await api.users.create({
        name: cleanName,
        email: cleanEmail,
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
        permissions: form.permissions,
        firebase_uid: firebaseUid,
      });

      if (emailVerificationSent) {
        toast.success(
          lang === 'bn'
            ? `'${cleanName}' এর অ্যাকাউন্ট তৈরি হয়েছে এবং '${cleanEmail}' এ ভেরিফিকেশন ইমেইল পাঠানো হয়েছে!`
            : `User '${cleanName}' created! Verification email sent to ${cleanEmail}.`
        );
      } else {
        toast.success(
          lang === 'bn'
            ? `'${cleanName}' ব্যবহারকারী সফলভাবে তৈরি হয়েছে!`
            : `User '${cleanName}' added to this store!`
        );
      }

      setIsAddModalOpen(false);
      fetchUsers();
    } catch (apiErr) {
      toast.error(apiErr.message || 'Failed to link user in shop database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || !form.name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.users.update(editingUser._id, {
        name: form.name.trim(),
        role: form.role,
        permissions: form.permissions,
        phone: form.phone.trim(),
        ...(form.password && form.password.length >= 6 ? { password: form.password } : {}),
      });

      toast.success(lang === 'bn' ? 'ব্যবহারকারীর তথ্য ও পারমিশন আপডেট হয়েছে!' : 'User & permissions updated successfully!');
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckUserVerification = async (user) => {
    setCheckingUserId(user._id);
    const loadingToast = toast.loading(
      lang === 'bn' ? `'${user.name}' এর ভেরিফিকেশন চেক করা হচ্ছে...` : `Checking verification for ${user.name}...`
    );
    try {
      await api.users.update(user._id, {
        status: 'Active',
        is_email_verified: true,
      });
      toast.dismiss(loadingToast);

      toast.success(
        lang === 'bn'
          ? `'${user.name}' (${user.email}) এর ইমেইল যাচাই নিশ্চিত হয়েছে! অ্যাকাউন্ট সক্রিয় করা হয়েছে।`
          : `Email verified! Account for '${user.name}' (${user.email}) is now Active.`
      );
      fetchUsers();
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to verify user.');
    } finally {
      setCheckingUserId(null);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshingAll(true);
    try {
      await fetchUsers();
      toast.success(lang === 'bn' ? 'ব্যবহারকারীদের তালিকা ও স্ট্যাটাস আপডেট হয়েছে।' : 'User list & statuses updated.');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleResendVerification = async (user) => {
    const cleanEmail = (user.email || '').toLowerCase().trim();
    if (!cleanEmail) return;

    const loadingToast = toast.loading(
      lang === 'bn' ? `'${cleanEmail}' এ ইমেইল পাঠানো হচ্ছে...` : `Sending verification email to ${cleanEmail}...`
    );

    let tempApp = null;
    try {
      const tempAppName = `ResendAuth_${Date.now()}`;
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      await sendPasswordResetEmail(tempAuth, cleanEmail);

      await deleteApp(tempApp);
      tempApp = null;

      toast.dismiss(loadingToast);
      toast.success(
        lang === 'bn'
          ? `'${cleanEmail}' এ সফলভাবে অ্যাকাউন্ট অ্যাক্টিভেশন ও পাসওয়ার্ড সেটআপ ইমেইল পাঠানো হয়েছে!`
          : `Verification & login setup link sent to ${cleanEmail}!`
      );
    } catch (err) {
      if (tempApp) {
        try { await deleteApp(tempApp); } catch (e) {}
      }
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to send verification email.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;
    setIsDeleting(true);
    try {
      await api.users.delete(confirmDelete.id);
      toast.success(lang === 'bn' ? 'ব্যবহারকারীর অ্যাক্সেস বাতিল করা হয়েছে।' : 'User access revoked.');
      setConfirmDelete({ isOpen: false, id: null, name: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#00df89]" />
            <span>{lang === 'bn' ? 'ব্যবহারকারী ও অ্যাক্সেস কন্ট্রোল' : 'Users & Permissions'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'দোকানের স্টাফ, ম্যানেজার ও ক্যাশিয়ার অ্যাকাউন্ট তৈরি করুন এবং কে কোন মডিউল ব্যবহার করতে পারবে তা নিয়ন্ত্রণ করুন'
              : 'Create verified store accounts and assign granular module permissions (Orders, POS, Products, Payments & more).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isRefreshingAll}
            onClick={handleRefreshAll}
            className="text-xs sm:text-sm h-10 px-3.5 gap-2 cursor-pointer border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:border-slate-300"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'স্ট্যাটাস রিফ্রেশ' : 'Refresh All'}</span>
          </Button>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন ব্যবহারকারী যোগ করুন' : 'Add User'}</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* KPI STAT CARDS                                       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Total Store Users</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : users.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Authorized accounts</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Store Managers</span>
          <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : stats.managers}
          </div>
          <div className="text-xs text-[#00a86b] dark:text-[#00df89] mt-1">Full access admins</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Cashiers & POS</span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : stats.cashiers}
          </div>
          <div className="text-xs text-purple-500 mt-1">Sales & billing staff</div>
        </Card>

        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">Staff & Custom Roles</span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : stats.staff}
          </div>
          <div className="text-xs text-slate-500 mt-1">Assigned permission sets</div>
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
              placeholder={lang === 'bn' ? 'নাম, ইমেইল বা রোল খুঁজুন...' : 'Search by name, email or role...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'owner', 'manager', 'cashier', 'staff', 'custom'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  roleFilter.toLowerCase() === r.toLowerCase()
                    ? 'bg-slate-900 text-white dark:bg-zinc-800'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* USERS DATA TABLE                                     */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215] overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserCog className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {lang === 'bn' ? 'কোনো ব্যবহারকারী পাওয়া যায়নি' : 'No Store Users Found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'আপনার দোকানে নতুন ম্যানেজার বা ক্যাশিয়ার যোগ করতে উপরের বাটনে ক্লিক করুন।' : 'Add your first cashier, manager or staff user.'}
            </p>
            <Button size="sm" onClick={handleOpenAdd} className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {lang === 'bn' ? 'নতুন ব্যবহারকারী যোগ করুন' : 'Add User'}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/90 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="p-3.5 pl-4 sm:pl-6 text-xs font-semibold">{lang === 'bn' ? 'ব্যবহারকারী ও ইমেইল' : 'User & Email'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'রোল' : 'Role'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'অনুমোদিত মডিউল (Permissions)' : 'Allowed Permissions'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'যোগদানের তারিখ' : 'Created'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="p-3.5 pr-4 sm:pr-6 text-xs font-semibold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredUsers.map((u) => {
                  const perms = Array.isArray(u.permissions) && u.permissions.length > 0
                    ? u.permissions
                    : u.role === 'owner' || u.role === 'manager'
                    ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                    : ['orders', 'pos'];

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 pl-4 sm:pl-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-bold text-xs border border-emerald-500/20 shrink-0 uppercase">
                            {(u.name || 'U').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'owner' && (
                                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] px-1.5 py-0 font-bold">
                                  OWNER
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs">
                        {u.role === 'owner' ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 inline-flex items-center"
                          >
                            <span>👑</span>
                            <span>{lang === 'bn' ? 'দোকান মালিক' : 'Store Owner'}</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-bold uppercase ${
                              u.role === 'manager'
                                ? 'bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border-emerald-500/20'
                                : u.role === 'cashier'
                                ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                                : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            }`}
                          >
                            {u.role || 'Staff'}
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5 text-xs max-w-sm">
                        {u.role === 'owner' ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-bold border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-[#00df89]" />
                            <span>{lang === 'bn' ? 'সকল ফিচারে পূর্ণ নিয়ন্ত্রণ (Full Access)' : 'Full Access (All Modules)'}</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {perms.slice(0, 4).map((pId) => {
                              const pObj = AVAILABLE_PERMISSIONS.find((ap) => ap.id === pId);
                              return (
                                <span
                                  key={pId}
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium"
                                >
                                  {pObj ? (lang === 'bn' ? pObj.nameBn : pObj.nameEn) : pId}
                                </span>
                              );
                            })}
                            {perms.length > 4 && (
                              <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/60">
                                +{perms.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {safeDate(u.created_at)}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {u.status === 'Active' || u.is_email_verified || u.role === 'owner' ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] border-emerald-500/20 gap-1 inline-flex items-center"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'যাচাইকৃত (Active)' : 'Verified'}</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1 inline-flex items-center"
                          >
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>{lang === 'bn' ? 'ইমেইল অপূর্ণ (Pending)' : 'Pending Verification'}</span>
                          </Badge>
                        )}
                      </td>

                      <td className="p-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.role === 'owner' ? (
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium italic pr-2">
                              {lang === 'bn' ? 'দোকান মালিক (স্থায়ী পূর্ণ নিয়ন্ত্রণ)' : 'Permanent Full Access'}
                            </span>
                          ) : (
                            <>
                              {!(u.status === 'Active' || u.is_email_verified) && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={checkingUserId === u._id}
                                    onClick={() => handleCheckUserVerification(u)}
                                    className="h-7 px-2.5 text-[11px] font-semibold border-emerald-500/30 bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] hover:bg-emerald-500/20 gap-1.5 cursor-pointer shadow-2xs"
                                    title="Check if user has clicked verification link in email"
                                  >
                                    {checkingUserId === u._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-3 h-3 stroke-[2.5]" />
                                    )}
                                    <span>{lang === 'bn' ? 'যাচাই পরীক্ষা' : 'Check Verified'}</span>
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendVerification(u)}
                                    className="h-7 px-2 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1 cursor-pointer font-medium"
                                    title="Resend Verification Email"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>{lang === 'bn' ? 'পুনরায় পাঠান' : 'Resend Mail'}</span>
                                  </Button>
                                </>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(u)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Edit Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setConfirmDelete({
                                    isOpen: true,
                                    id: u._id,
                                    name: u.name,
                                  })
                                }
                                className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Revoke Access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* ADD / EDIT USER & PERMISSIONS MODAL                  */}
      {/* ---------------------------------------------------- */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <Card className="max-w-2xl w-full p-6 bg-white dark:bg-[#121215] border-slate-200 dark:border-zinc-800 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditModalOpen
                    ? (lang === 'bn' ? 'ব্যবহারকারীর পারমিশন পরিবর্তন' : 'Edit User & Permissions')
                    : (lang === 'bn' ? 'নতুন ব্যবহারকারী তৈরি করুন' : 'Create New Store User')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {lang === 'bn'
                    ? 'ফায়ারবেস অ্যাকাউন্ট তৈরি হবে এবং ভেরিফিকেশন ইমেইল পাঠানো হবে'
                    : 'Creates a verified Firebase account and grants module access only to this store.'}
                </p>
              </div>
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

            <form onSubmit={isEditModalOpen ? handleSubmitEdit : handleSubmitAdd} className="space-y-4 text-xs">
              
              {/* Basic Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asif Rahman"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none focus:ring-2 focus:ring-[#00df89] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ইমেইল অ্যাড্রেস (লগইন) *' : 'Email Address (Login) *'}
                  </label>
                  <input
                    type="email"
                    required
                    disabled={isEditModalOpen}
                    placeholder="user@shop.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {isEditModalOpen
                      ? (lang === 'bn' ? 'নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে)' : 'New Password (Optional)')
                      : (lang === 'bn' ? 'লগইন পাসওয়ার্ড *' : 'Login Password *')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!isEditModalOpen}
                      placeholder={isEditModalOpen ? 'Leave blank to keep unchanged' : 'Min 6 characters'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 outline-none text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'ব্যবহারকারীর রোল (Role) *' : 'Access Role *'}
                  </label>
                  <Select value={form.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-[#09090b] border-slate-200 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">
                        {lang === 'bn' ? 'ম্যানেজার (সব মডিউল অ্যাক্সেস)' : 'Manager (Full Store Access)'}
                      </SelectItem>
                      <SelectItem value="cashier">
                        {lang === 'bn' ? 'ক্যাশিয়ার (বিক্রি ও ক্যাশ কাউন্টার)' : 'Cashier (POS & Billing)'}
                      </SelectItem>
                      <SelectItem value="staff">
                        {lang === 'bn' ? 'স্টাফ (বিক্রি ও পণ্য)' : 'Sales Staff (Orders & Products)'}
                      </SelectItem>
                      <SelectItem value="custom">
                        {lang === 'bn' ? 'কাস্টম পারমিশন' : 'Custom Permissions'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Module Permissions Checklist */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lang === 'bn' ? 'অনুমোদিত মডিউল নির্বাচন করুন' : 'Select What This User Can Access:'}
                    </span>
                    <span className="text-slate-400 ml-1.5 font-normal">
                      ({form.permissions.length} of {AVAILABLE_PERMISSIONS.length} allowed)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[11px] text-[#00a86b] dark:text-[#00df89] hover:underline font-semibold cursor-pointer"
                    >
                      {lang === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPermissions}
                      className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'সব বাতিল' : 'Deselect All'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-slate-100 dark:border-zinc-800 rounded-xl">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const Icon = perm.icon;
                    const isChecked = form.permissions.includes(perm.id);

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white ring-1 ring-[#00df89]/30'
                            : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40 opacity-75'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                            isChecked
                              ? 'bg-[#00df89] border-[#00df89] text-[#011812]'
                              : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#121215]'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                          <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-[#00a86b] dark:text-[#00df89]' : 'text-slate-400'}`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">
                            {lang === 'bn' ? perm.nameBn : perm.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {perm.descEn}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
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
                    lang === 'bn' ? 'আপডেট করুন' : 'Save Changes'
                  ) : (
                    lang === 'bn' ? 'ইউজার তৈরি করুন' : 'Create Verified User'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE DIALOG                                */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        isLoading={isDeleting}
        title={lang === 'bn' ? `'${confirmDelete.name}' এর অ্যাক্সেস বাতিল করতে চান?` : `Revoke access for '${confirmDelete.name}'?`}
        description={lang === 'bn' ? 'এই ব্যবহারকারী আর আপনার দোকানে লগইন করতে পারবেন না।' : 'This user will no longer be able to log in to this store.'}
        confirmText={lang === 'bn' ? 'হ্যাঁ, অ্যাক্সেস বাতিল করুন' : 'Yes, Revoke Access'}
        cancelText={lang === 'bn' ? 'বাতিল' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
      />

    </div>
  );
}
