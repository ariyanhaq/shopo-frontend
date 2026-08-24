/**
 * @file Users.jsx
 * @description Comprehensive Store Users & Connected Devices management with live active session monitoring, device tracking, force-logout / offline toggles, and granular RBAC permissions.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
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
import Pagination from '@/components/common/Pagination';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import {
  ShieldCheck, Plus, Search, Trash2, Edit2, Loader2, X,
  CheckCircle2, UserCog, Mail, Phone, Lock, Eye, EyeOff,
  ShoppingCart, Store, Package, ShoppingBag, Building2,
  Users as UsersIcon, CreditCard, DollarSign, UserCheck,
  BarChart3, Settings, Check, Sparkles, AlertCircle,
  Clock, RotateCw, Laptop, Smartphone, Monitor, Globe,
  PowerOff, Radio, Wifi, WifiOff, LogOut
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

const formatRelativeTime = (val, lang) => {
  if (!val) return lang === 'bn' ? 'অজ্ঞাত' : 'Unknown';
  const time = new Date(val).getTime();
  if (isNaN(time)) return String(val);

  const diffSeconds = Math.floor((Date.now() - time) / 1000);
  if (diffSeconds < 60) return lang === 'bn' ? 'এইমাত্র সক্রিয়' : 'Just now';
  if (diffSeconds < 3600) {
    const mins = Math.floor(diffSeconds / 60);
    return lang === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return lang === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return lang === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
};

const getDeviceIcon = (deviceType = '', os = '') => {
  const dt = String(deviceType).toLowerCase();
  const o = String(os).toLowerCase();
  if (dt.includes('mobile') || o.includes('android') || o.includes('ios') || o.includes('iphone')) {
    return Smartphone;
  }
  if (dt.includes('terminal') || dt.includes('pos')) {
    return Store;
  }
  if (dt.includes('laptop') || o.includes('mac')) {
    return Laptop;
  }
  return Monitor;
};

export default function Users() {
  const { lang } = useLanguage();
  const { mongoShop, currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total_users: 0,
    online_users: 0,
    offline_users: 0,
    managers: 0,
    cashiers: 0,
    staff: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline'

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

  const fetchUsers = async (silent = false) => {
    if (!silent) setIsLoading(true);
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
        const onlineCount = docs.filter((u) => u.is_online).length;
        const managers = docs.filter((u) => u.role === 'manager' || u.role === 'owner').length;
        const cashiers = docs.filter((u) => u.role === 'cashier').length;
        const staff = docs.filter((u) => u.role === 'staff' || u.role === 'employee' || u.role === 'custom').length;
        setStats({
          total_users: docs.length,
          online_users: onlineCount,
          offline_users: docs.length - onlineCount,
          managers,
          cashiers,
          staff,
        });
      }
    } catch (err) {
      console.warn('Failed to load store users & devices:', err.message);
      if (!silent) toast.error('Failed to load store users & devices.');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Auto-refresh active sessions and connected devices every 25 seconds
    const interval = setInterval(() => {
      fetchUsers(true);
    }, 25000);

    return () => clearInterval(interval);
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
      permissions: ['orders', 'pos'],
      role: 'staff',
    }));
  };

  const handleToggleUserSession = async (user, forceAction = null) => {
    const isCurrentlyOnline = user.is_online;
    const targetAction = forceAction || (isCurrentlyOnline ? 'offline' : 'online');
    setTogglingUserId(user._id);

    try {
      if (targetAction === 'offline') {
        await api.users.setOffline(user._id);
        toast.success(
          lang === 'bn'
            ? `'${user.name}' এর সেশন বাতিল করা হয়েছে এবং অফলাইনে পাঠানো হয়েছে!`
            : `'${user.name}' session terminated and set to Offline!`
        );
      } else {
        await api.users.toggleSession(user._id, 'online');
        toast.success(
          lang === 'bn'
            ? `'${user.name}' কে সক্রিয় অনলাইনে চিহ্নিত করা হয়েছে!`
            : `'${user.name}' marked as Online!`
        );
      }

      // Optimistically update local users state
      setUsers((prev) =>
        prev.map((u) => {
          if (u._id === user._id) {
            return {
              ...u,
              is_online: targetAction === 'online',
              last_active_at: targetAction === 'online' ? new Date().toISOString() : u.last_active_at,
            };
          }
          return u;
        })
      );
      fetchUsers(true);
    } catch (err) {
      console.error('Session toggle error:', err);
      toast.error(err.message || 'Failed to update user session status.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error(lang === 'bn' ? 'অনুগ্রহ করে সকল আবশ্যক ফিল্ড পূরণ করুন।' : 'Please fill all required fields.');
      return;
    }
    if (form.password.length < 6) {
      toast.error(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = form.email.toLowerCase().trim();
    const cleanName = form.name.trim();

    let firebaseUid = null;
    let secondaryApp = null;
    let emailVerificationSent = false;

    try {
      const tempAppName = `AddUserAuth_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, form.password);
      firebaseUid = userCredential.user.uid;

      await updateProfile(userCredential.user, { displayName: cleanName });

      try {
        await sendEmailVerification(userCredential.user);
        emailVerificationSent = true;
      } catch (e) {
        console.warn('Verification email send issue:', e.message);
      }

      await deleteApp(secondaryApp);
      secondaryApp = null;
    } catch (fbErr) {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (e) {}
      }
      if (fbErr.code === 'auth/email-already-in-use') {
        toast.error(lang === 'bn' ? 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত।' : 'This email is already registered in Firebase.');
      } else {
        toast.error(fbErr.message || 'Firebase account creation failed.');
      }
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

      toast.success(
        lang === 'bn'
          ? `'${cleanName}' ব্যবহারকারী এবং ডিভাইস প্রোফাইল সফলভাবে তৈরি হয়েছে!`
          : `User '${cleanName}' added to this store!`
      );

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
      toast.success(lang === 'bn' ? 'লাইভ সেশন ও ডিভাইসের তালিকা আপডেট হয়েছে।' : 'Live sessions & device list refreshed.');
    } finally {
      setIsRefreshingAll(false);
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
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.current_device?.os && u.current_device.os.toLowerCase().includes(q)) ||
        (u.current_device?.device_name && u.current_device.device_name.toLowerCase().includes(q));

      const matchesRole =
        roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'online' && u.is_online) ||
        (statusFilter === 'offline' && !u.is_online);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  return (
    <div className="space-y-6 font-sans pb-12">
      
      {/* ---------------------------------------------------- */}
      {/* HEADER SECTION                                       */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00df89]/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span>{lang === 'bn' ? 'ব্যবহারকারী ও ডিভাইস' : 'Users & Devices'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'বর্তমানে দোকানে কে কে অনলাইনে সক্রিয় রয়েছে তা পর্যবেক্ষণ করুন এবং প্রয়োজনে যেকোনো ডিভাইস সেশন অফলাইন করুন।'
              : 'Monitor real-time active users and connected POS devices, force-logout sessions, and manage role permissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isRefreshingAll}
            onClick={handleRefreshAll}
            className="text-xs sm:text-sm h-10 px-3.5 gap-2 cursor-pointer border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121215] text-slate-700 dark:text-zinc-300 hover:border-slate-300 shadow-xs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingAll ? 'animate-spin' : ''}`} />
            <span>{lang === 'bn' ? 'সেশন রিফ্রেশ' : 'Refresh Sessions'}</span>
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
        {/* Total Accounts */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট ব্যবহারকারী' : 'Total Store Users'}
            </span>
            <UsersIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : users.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'অনুমোদিত অ্যাকাউন্ট' : 'Authorized team accounts'}
          </div>
        </Card>

        {/* 🟢 Live Active Users Now */}
        <Card className="p-4 sm:p-5 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 dark:border-emerald-500/30 shadow-xs rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>{lang === 'bn' ? 'বর্তমানে অনলাইনে সক্রিয়' : 'Active Online Now'}</span>
            </span>
            <Wifi className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#00a86b] dark:text-[#00df89] mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : stats.online_users || users.filter(u => u.is_online).length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {lang === 'bn' ? 'লাইভ টার্মিনাল সেশন' : 'Live active devices'}
          </div>
        </Card>

        {/* Offline Terminals */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'অফলাইন ডিভাইস' : 'Offline / Idle'}
            </span>
            <WifiOff className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-zinc-300 mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : (users.length - (stats.online_users || users.filter(u => u.is_online).length))}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {lang === 'bn' ? 'নিষ্ক্রিয় সেশন' : 'Disconnected sessions'}
          </div>
        </Card>

        {/* Store Managers & POS */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'ম্যানেজার ও ক্যাশিয়ার' : 'Managers & POS'}
            </span>
            <Store className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {isLoading ? <Skeleton className="h-8 w-20 my-0.5" /> : (stats.managers + stats.cashiers)}
          </div>
          <div className="text-[11px] text-purple-500 mt-1">
            {lang === 'bn' ? 'ক্যাশ ও অ্যাডমিন এক্সেস' : 'POS billing operators'}
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <Card className="p-4 border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              {lang === 'bn' ? 'সকল ইউজার ও ডিভাইস' : 'All Users & Devices'} ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('online')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{lang === 'bn' ? 'অনলাইন' : 'Online Now'}</span> ({users.filter(u => u.is_online).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('offline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'offline'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              {lang === 'bn' ? 'অফলাইন' : 'Offline'} ({users.filter(u => !u.is_online).length})
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="w-full sm:w-64 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'নাম, ইমেইল, ডিভাইস বা IP...' : 'Search name, email, device or IP...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#09090b] border border-slate-200 dark:border-zinc-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
              />
            </div>

            {/* Role Filter */}
            <div className="w-full sm:w-44">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger size="sm" className="bg-slate-50 dark:bg-[#09090b] w-full h-9.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold">
                  <SelectValue placeholder={lang === 'bn' ? 'সকল রোল' : 'All Roles'} />
                </SelectTrigger>
                <SelectContent className="min-w-[180px]">
                  <SelectItem value="all">
                    {lang === 'bn' ? 'সকল রোল' : 'All Roles'}
                  </SelectItem>
                  <SelectItem value="owner">
                    {lang === 'bn' ? 'দোকান মালিক' : 'Store Owner'}
                  </SelectItem>
                  <SelectItem value="manager">
                    {lang === 'bn' ? 'ম্যানেজার' : 'Manager'}
                  </SelectItem>
                  <SelectItem value="cashier">
                    {lang === 'bn' ? 'ক্যাশিয়ার' : 'Cashier'}
                  </SelectItem>
                  <SelectItem value="staff">
                    {lang === 'bn' ? 'স্টাফ' : 'Staff'}
                  </SelectItem>
                  <SelectItem value="custom">
                    {lang === 'bn' ? 'কাস্টম রোল' : 'Custom Role'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>
      </Card>

      {/* ---------------------------------------------------- */}
      {/* USERS & DEVICES DATA TABLE                           */}
      {/* ---------------------------------------------------- */}
      <Card className="p-0 border-slate-200/90 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs rounded-2xl overflow-hidden">
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
              {lang === 'bn' ? 'কোনো ব্যবহারকারী বা ডিভাইস পাওয়া যায়নি' : 'No Store Users or Devices Found'}
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
                <tr className="border-b border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/75 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 font-medium">
                  <th className="p-3.5 pl-4 sm:pl-6 text-xs font-semibold">{lang === 'bn' ? 'ব্যবহারকারী ও ইমেইল' : 'User & Email'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'রোল' : 'Role'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'লাইভ সেশন ও ডিভাইস' : 'Live Session & Device'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'অনুমোদিত মডিউল' : 'Permissions'}</th>
                  <th className="p-3.5 text-xs font-semibold">{lang === 'bn' ? 'সেশন কন্ট্রোল' : 'Session Status'}</th>
                  <th className="p-3.5 pr-4 sm:pr-6 text-xs font-semibold text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {paginatedUsers.map((u) => {
                  const isOwner = u.role === 'owner';
                  const isOnline = Boolean(u.is_online);
                  const device = u.current_device || {};
                  const DeviceIcon = getDeviceIcon(device.device_type, device.os);
                  const perms = Array.isArray(u.permissions) && u.permissions.length > 0
                    ? u.permissions
                    : isOwner || u.role === 'manager'
                    ? AVAILABLE_PERMISSIONS.map((p) => p.id)
                    : ['orders', 'pos'];

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors">
                      
                      {/* User & Email */}
                      <td className="p-3.5 pl-4 sm:pl-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] flex items-center justify-center font-bold text-xs border border-emerald-500/20 shrink-0 uppercase">
                              {(u.name || 'U').slice(0, 2)}
                            </div>
                            {/* Live dot on avatar */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#121215] ${
                                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'
                              }`}
                              title={isOnline ? 'Online Now' : 'Offline'}
                            />
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isOwner && (
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

                      {/* Role */}
                      <td className="p-3.5 whitespace-nowrap text-xs">
                        {isOwner ? (
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

                      {/* Live Session & Connected Device */}
                      <td className="p-3.5 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOnline
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 border border-slate-200 dark:border-zinc-700'
                          }`}>
                            <DeviceIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <span>{device.device_name || device.os || 'Desktop Browser'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <span>{device.ip || '127.0.0.1'}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(u.last_active_at, lang)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Permissions */}
                      <td className="p-3.5 text-xs max-w-xs">
                        {isOwner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-[#00a86b] dark:text-[#00df89] font-bold border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-[#00df89]" />
                            <span>{lang === 'bn' ? 'সকল ফিচারে পূর্ণ নিয়ন্ত্রণ' : 'All Modules'}</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1">
                            {perms.slice(0, 3).map((pId) => {
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
                            {perms.length > 3 && (
                              <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/60">
                                +{perms.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Session Status & Force-Offline Button */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isOnline ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1.5 inline-flex items-center shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>{lang === 'bn' ? 'সক্রিয় (Online)' : 'Online Now'}</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 gap-1 inline-flex items-center"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>{lang === 'bn' ? 'অফলাইন' : 'Offline'}</span>
                            </Badge>
                          )}

                          {/* Owner action to Make Offline / Online */}
                          {!isOwner && (
                            <button
                              type="button"
                              disabled={togglingUserId === u._id}
                              onClick={() => handleToggleUserSession(u)}
                              className={`h-7 px-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0 ${
                                isOnline
                                  ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                                  : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:border-slate-300'
                              }`}
                              title={isOnline ? 'Force logout and set offline' : 'Set as online'}
                            >
                              {togglingUserId === u._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isOnline ? (
                                <>
                                  <PowerOff className="w-3 h-3 text-rose-500" />
                                  <span>{lang === 'bn' ? 'অফলাইন করুন' : 'Force Offline'}</span>
                                </>
                              ) : (
                                <>
                                  <Radio className="w-3 h-3 text-slate-400" />
                                  <span>{lang === 'bn' ? 'অনলাইন করুন' : 'Set Online'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5 pr-4 sm:pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOwner ? (
                            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium italic pr-2">
                              {lang === 'bn' ? 'মালিক অ্যাকাউন্ট' : 'Owner Master'}
                            </span>
                          ) : (
                            <>
                              {!(u.status === 'Active' || u.is_email_verified) && (
                                <button
                                  type="button"
                                  disabled={checkingUserId === u._id}
                                  onClick={() => handleCheckUserVerification(u)}
                                  className="h-8 px-2.5 text-xs font-bold rounded-lg border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 text-[#00a86b] dark:text-[#00df89] hover:bg-emerald-100 dark:hover:bg-emerald-900/60 gap-1.5 cursor-pointer shadow-2xs flex items-center transition-colors shrink-0"
                                  title="Check if user has clicked verification link in email"
                                >
                                  {checkingUserId === u._id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>{lang === 'bn' ? 'যাচাই করুন' : 'Verify'}</span>
                                </button>
                              )}

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(u)}
                                className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Edit User & Permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setConfirmDelete({ isOpen: true, id: u._id, name: u.name })}
                                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                title="Revoke User Access"
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

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-slate-200/90 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-[#09090b]">
            <Pagination
              currentPage={currentPage}
              totalCount={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </Card>

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADD USER & PERMISSIONS                        */}
      {/* ---------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'দোকানে নতুন ব্যবহারকারী যোগ করুন' : 'Add Store User & Device'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {lang === 'bn' ? 'ব্যবহারকারীর ইমেইল ও পাসওয়ার্ড সেট করে অনুমতি নির্ধারণ করুন' : 'Provision credentials and select module access permissions.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ব্যবহারকারীর নাম' : 'Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rahim Ahmed"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="staff@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 chars)'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Role Preset Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
                  {lang === 'bn' ? 'রোল নির্বাচন করুন' : 'Select User Role Preset'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(ROLE_PRESETS).map(([key, item]) => {
                    const isSelected = form.role === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRoleChange(key)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white font-bold ring-1 ring-[#00df89]'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{lang === 'bn' ? item.labelBn : item.labelEn}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Module Permissions */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'মডিউল পারমিশন নির্বাচন' : 'Module Permissions Access'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline"
                    >
                      {lang === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPermissions}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      {lang === 'bn' ? 'রিসেট' : 'Reset'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const PermIcon = perm.icon;
                    const isChecked = form.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-zinc-100'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-850/40 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-0.5 w-4 h-4 accent-[#00df89] rounded cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <PermIcon className="w-3.5 h-3.5 text-[#00a86b] dark:text-[#00df89]" />
                            <span>{lang === 'bn' ? perm.nameBn : perm.nameEn}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{perm.descEn}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs h-10 px-4"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-10 px-5 gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{lang === 'bn' ? 'ব্যবহারকারী যোগ করুন' : 'Create User'}</span>
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: EDIT USER & PERMISSIONS                       */}
      {/* ---------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'ব্যবহারকারী ও পারমিশন সম্পাদনা' : 'Edit User & Permissions'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {editingUser?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ব্যবহারকারীর নাম' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                  />
                </div>

                {/* Password (Optional for update) */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
                    {lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন (ঐচ্ছিক)' : 'Update Password (Leave blank to keep unchanged)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#00df89]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role Preset Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-2">
                  {lang === 'bn' ? 'রোল নির্বাচন করুন' : 'Select User Role Preset'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(ROLE_PRESETS).map(([key, item]) => {
                    const isSelected = form.role === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleRoleChange(key)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00df89] bg-[#00df89]/10 text-slate-900 dark:text-white font-bold ring-1 ring-[#00df89]'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs">{lang === 'bn' ? item.labelBn : item.labelEn}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Module Permissions */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    {lang === 'bn' ? 'মডিউল পারমিশন নির্বাচন' : 'Module Permissions Access'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[11px] font-semibold text-[#00a86b] dark:text-[#00df89] hover:underline"
                    >
                      {lang === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                    </button>
                    <span className="text-slate-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllPermissions}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      {lang === 'bn' ? 'রিসেট' : 'Reset'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const PermIcon = perm.icon;
                    const isChecked = form.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-zinc-100'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-850/40 text-slate-500 dark:text-zinc-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.id)}
                          className="mt-0.5 w-4 h-4 accent-[#00df89] rounded cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <PermIcon className="w-3.5 h-3.5 text-[#00a86b] dark:text-[#00df89]" />
                            <span>{lang === 'bn' ? perm.nameBn : perm.nameEn}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{perm.descEn}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-xs h-10 px-4"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-bold text-xs h-10 px-5 gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                  <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* CONFIRM DELETE DIALOG                                */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title={lang === 'bn' ? 'ব্যবহারকারীর অ্যাক্সেস বাতিল করবেন?' : 'Revoke User Access?'}
        description={
          lang === 'bn'
            ? `আপনি কি নিশ্চিত যে '${confirmDelete.name}' এর অ্যাকাউন্ট এবং সকল ডিভাইসের সেশন স্থায়ীভাবে বাতিল করতে চান?`
            : `Are you sure you want to revoke store access and terminate sessions for '${confirmDelete.name}'?`
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Revoke Access'}
        cancelText={lang === 'bn' ? 'না' : 'Cancel'}
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
}

function SaveIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  );
}
