import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import {
  Crown,
  Sparkles,
  Star,
  Users,
  Plus,
  Search,
  Settings,
  CheckCircle2,
  Trash2,
  Coins,
  DollarSign,
  ArrowUpRight,
  Phone,
  X,
  Save,
  RefreshCw,
  Loader2,
  Gift,
  Percent,
} from 'lucide-react';

const DEFAULT_TIERS = [
  {
    name: 'Regular',
    min_points: 0,
    welcome_bonus_points: 20,
    earn_spend_unit: 100,
    earn_points_per_unit: 1,
    point_redeem_value: 0.5,
    min_points_to_redeem: 50,
    extra_discount_percent: 0,
    color: '#10b981',
  },
  {
    name: 'Silver',
    min_points: 200,
    welcome_bonus_points: 0,
    earn_spend_unit: 100,
    earn_points_per_unit: 1.5,
    point_redeem_value: 0.6,
    min_points_to_redeem: 40,
    extra_discount_percent: 2,
    color: '#94a3b8',
  },
  {
    name: 'Gold',
    min_points: 500,
    welcome_bonus_points: 0,
    earn_spend_unit: 100,
    earn_points_per_unit: 2,
    point_redeem_value: 0.75,
    min_points_to_redeem: 25,
    extra_discount_percent: 5,
    color: '#f59e0b',
  },
  {
    name: 'VIP',
    min_points: 1200,
    welcome_bonus_points: 0,
    earn_spend_unit: 100,
    earn_points_per_unit: 3,
    point_redeem_value: 1.0,
    min_points_to_redeem: 15,
    extra_discount_percent: 8,
    color: '#8b5cf6',
  },
  {
    name: 'Platinum',
    min_points: 2500,
    welcome_bonus_points: 0,
    earn_spend_unit: 100,
    earn_points_per_unit: 5,
    point_redeem_value: 1.5,
    min_points_to_redeem: 10,
    extra_discount_percent: 10,
    color: '#06b6d4',
  },
];

const getTierBadgeStyle = (rawColor = '#10b981') => {
  let hex = typeof rawColor === 'string' && rawColor.trim().startsWith('#') ? rawColor.trim() : '#10b981';
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return {
    backgroundColor: `${hex}18`,
    color: hex,
    borderColor: `${hex}38`,
  };
};

export default function Members() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { mongoShop } = useAuth();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'settings'
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({
    total_members: 0,
    total_points: 0,
    total_points_earned: 0,
    total_points_redeemed: 0,
    total_tier_discount: 0,
    total_reward_discount: 0,
    total_discount_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, tierFilter, pageSize]);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return members.slice(start, start + pageSize);
  }, [members, currentPage, pageSize]);

  // Program Settings State
  const [settingsData, setSettingsData] = useState({
    enabled: true,
    reward_type: 'hybrid', // 'points' | 'discount' | 'hybrid'
    earn_spend_unit: 100, // spend ৳100
    earn_points_per_unit: 1, // get 1 point
    point_redeem_value: 0.5, // 1 point = ৳0.50
    min_points_to_redeem: 50, // minimum 50 points
    welcome_bonus_points: 20,
    tiers: DEFAULT_TIERS,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Enroll / Add Member Modal State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);
  const [enrollMode, setEnrollMode] = useState('existing'); // 'existing' | 'new'
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [isLoadingExistingCustomers, setIsLoadingExistingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState(null);
  const [showExistingCustomerDropdown, setShowExistingCustomerDropdown] = useState(false);

  const [enrollForm, setEnrollForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    membership_tier: 'Regular',
    initial_points: 20,
    member_code: '',
  });

  // Available active tiers configured in settings
  const activeTiers = useMemo(() => {
    if (Array.isArray(settingsData?.tiers) && settingsData.tiers.length > 0) {
      return settingsData.tiers.map((t) => (typeof t === 'string' ? { name: t } : t));
    }
    return [{ name: 'Regular' }];
  }, [settingsData?.tiers]);

  // Adjust Points Modal
  const [pointAdjustModal, setPointAdjustModal] = useState({
    isOpen: false,
    member: null,
    type: 'add', // 'add' | 'deduct'
    points: '',
    reason: '',
    isSubmitting: false,
  });

  // Delete / Remove Membership Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
    isSubmitting: false,
  });

  // Lock background scroll when any modal is open
  useBodyScrollLock(isEnrollModalOpen || pointAdjustModal.isOpen || deleteConfirm.isOpen);

  // Fetch Members and Settings on load
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = {};
      if (searchQuery && searchQuery.trim()) queryParams.search = searchQuery.trim();
      if (tierFilter && tierFilter !== 'all') queryParams.tier = tierFilter;

      const [membersRes, settingsRes] = await Promise.allSettled([
        api.membership.getMembers(queryParams),
        api.membership.getSettings(),
      ]);

      if (membersRes.status === 'fulfilled') {
        const raw = membersRes.value ?? {};
        const payload = raw?.data ?? raw;
        const memberList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.docs)
          ? payload.docs
          : Array.isArray(raw?.docs)
          ? raw.docs
          : [];
        setMembers(memberList);

        const loadedStats = raw?.stats || payload?.stats || raw?.data?.stats || {};
        const fallbackMembers = memberList.length;
        const fallbackPoints = memberList.reduce((sum, m) => sum + (Number(m.reward_points) || 0), 0);
        const fallbackEarned = memberList.reduce((sum, m) => sum + (Number(m.total_points_earned) || 0), 0);
        const fallbackRedeemed = memberList.reduce((sum, m) => sum + (Number(m.total_points_redeemed) || 0), 0);

        setStats({
          total_members: loadedStats.total_members !== undefined ? Number(loadedStats.total_members) : fallbackMembers,
          total_points: loadedStats.total_points !== undefined ? Number(loadedStats.total_points) : fallbackPoints,
          total_points_earned: loadedStats.total_points_earned !== undefined ? Number(loadedStats.total_points_earned) : fallbackEarned,
          total_points_redeemed: loadedStats.total_points_redeemed !== undefined ? Number(loadedStats.total_points_redeemed) : fallbackRedeemed,
          total_tier_discount: Number(loadedStats.total_tier_discount) || 0,
          total_reward_discount: Number(loadedStats.total_reward_discount) || 0,
          total_discount_amount: Number(loadedStats.total_discount_amount) || 0,
        });
      }

      if (settingsRes.status === 'fulfilled') {
        const s = settingsRes.value?.data || settingsRes.value;
        if (s) {
          setSettingsData({
            enabled: s.enabled !== false,
            reward_type: s.reward_type || 'hybrid',
            earn_spend_unit: s.earn_spend_unit || 100,
            earn_points_per_unit: s.earn_points_per_unit || 1,
            point_redeem_value: s.point_redeem_value || 0.5,
            min_points_to_redeem: s.min_points_to_redeem || 50,
            welcome_bonus_points: s.welcome_bonus_points || 20,
            tiers: Array.isArray(s.tiers) && s.tiers.length > 0 ? s.tiers : DEFAULT_TIERS,
          });
        }
      }
    } catch (err) {
      console.error('Error loading membership data:', err);
      toast.error('Failed to load membership data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tierFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Save Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      const payload = {
        enabled: Boolean(settingsData.enabled),
        reward_type: settingsData.reward_type || 'hybrid',
        tiers: (settingsData.tiers && settingsData.tiers.length > 0 ? settingsData.tiers : DEFAULT_TIERS).map((t, idx) => ({
          name: t.name ? t.name.trim() : `Tier ${idx + 1}`,
          min_points: Math.max(0, Number(t.min_points) || 0),
          welcome_bonus_points: Math.max(0, Number(t.welcome_bonus_points) || 0),
          earn_spend_unit: Math.max(0, Number(t.earn_spend_unit) || 0),
          earn_points_per_unit: Math.max(0, Number(t.earn_points_per_unit) || 0),
          point_redeem_value: Math.max(0, Number(t.point_redeem_value) || 0),
          min_points_to_redeem: Math.max(0, Number(t.min_points_to_redeem) || 0),
          extra_discount_percent: Math.max(0, Math.min(100, Number(t.extra_discount_percent) || 0)),
          color: t.color || '#10b981',
        })),
      };

      await api.membership.updateSettings(payload);
      toast.success(lang === 'bn' ? 'মেম্বারশিপ সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' : 'Membership settings saved successfully.');
      fetchData();
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Tier Management Handlers
  const handleTierChange = (index, field, value) => {
    const updated = [...settingsData.tiers];
    if (field === 'extra_discount_percent' && Number(value) > 0) {
      // Percentage-based tiers do not have a welcome bonus points reward
      updated[index] = { ...updated[index], [field]: value, welcome_bonus_points: 0 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSettingsData({ ...settingsData, tiers: updated });
  };

  const handleAddTier = () => {
    const currentTiers = settingsData.tiers && settingsData.tiers.length > 0 ? settingsData.tiers : DEFAULT_TIERS;
    const newTier = {
      name: `Tier ${currentTiers.length + 1}`,
      min_points: 0,
      welcome_bonus_points: 20,
      extra_discount_percent: 0,
      earn_spend_unit: 100,
      earn_points_per_unit: 1,
      point_redeem_value: 0.5,
      min_points_to_redeem: 50,
      color: '#00df89',
    };
    setSettingsData({ ...settingsData, tiers: [...currentTiers, newTier] });
  };

  const handleRemoveTier = (index) => {
    if (settingsData.tiers.length <= 1) {
      toast.error(lang === 'bn' ? 'কমপক্ষে একটি টিয়ার থাকতে হবে।' : 'At least one tier is required.');
      return;
    }
    const updated = settingsData.tiers.filter((_, idx) => idx !== index);
    setSettingsData({ ...settingsData, tiers: updated });
  };

  const handleResetDefaultTiers = () => {
    setSettingsData({ ...settingsData, tiers: DEFAULT_TIERS });
    toast.success(lang === 'bn' ? 'স্ট্যান্ডার্ড টিয়ার রুলস লোড করা হয়েছে।' : 'Standard default tiers restored.');
  };

  // Fetch Customers for enrollment dropdown
  const fetchExistingCustomers = async () => {
    setIsLoadingExistingCustomers(true);
    try {
      const res = await api.customers.list({ limit: 100 });
      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.docs)
        ? res.data.docs
        : [];
      setExistingCustomers(rawList);
    } catch (err) {
      console.warn('Failed to load existing customers:', err.message);
    } finally {
      setIsLoadingExistingCustomers(false);
    }
  };

  // Filter existing customers: only show customers who are not yet enrolled in membership
  const filteredExistingCustomers = useMemo(() => {
    const nonMembers = existingCustomers.filter((c) => !c.is_member);
    if (!customerSearchQuery.trim()) return nonMembers.slice(0, 30);
    const q = customerSearchQuery.toLowerCase().trim();
    return nonMembers.filter((c) =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [existingCustomers, customerSearchQuery]);

  // Open Enroll Modal and populate customer list
  const handleOpenEnrollModal = () => {
    const defaultTier = activeTiers[0]?.name || 'Regular';
    setEnrollMode('existing');
    setSelectedExistingCustomer(null);
    setCustomerSearchQuery('');
    setShowExistingCustomerDropdown(false);
    setEnrollForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      membership_tier: defaultTier,
      initial_points: settingsData.welcome_bonus_points || 20,
      member_code: '',
    });
    fetchExistingCustomers();
    setIsEnrollModalOpen(true);
  };

  // Select customer from list in modal
  const handleSelectExistingCustomer = (cust) => {
    setSelectedExistingCustomer(cust);
    setShowExistingCustomerDropdown(false);
    setCustomerSearchQuery('');
    setEnrollForm((prev) => ({
      ...prev,
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      membership_tier: cust.membership_tier || 'Regular',
      initial_points: cust.is_member ? 0 : (settingsData.welcome_bonus_points || 20),
      member_code: cust.member_code || '',
    }));
  };

  // Handle Enroll Member Submit
  const handleEnrollSubmit = async (e) => {
    e.preventDefault();

    if (enrollMode === 'existing' && !selectedExistingCustomer) {
      toast.error(
        lang === 'bn'
          ? 'অনুগ্রহ করে কাস্টমার তালিকা থেকে একজন গ্রাহক নির্বাচন করুন।'
          : 'Please search and select a customer from the list.'
      );
      return;
    }

    if (enrollMode === 'new' && !enrollForm.name.trim()) {
      toast.error(lang === 'bn' ? 'সদস্যের নাম দিন।' : 'Please provide member name.');
      return;
    }

    setIsSubmittingEnroll(true);
    try {
      const payload = enrollMode === 'existing' && selectedExistingCustomer
        ? {
            customer_id: selectedExistingCustomer._id,
            name: selectedExistingCustomer.name,
            phone: selectedExistingCustomer.phone,
            email: selectedExistingCustomer.email,
            address: selectedExistingCustomer.address,
            membership_tier: enrollForm.membership_tier,
            initial_points: Number(enrollForm.initial_points) || 0,
            member_code: enrollForm.member_code,
          }
        : {
            ...enrollForm,
            initial_points: Number(enrollForm.initial_points) || 0,
          };

      await api.membership.enrollMember(payload);

      toast.success(
        lang === 'bn'
          ? 'মেম্বারশিপ সফলভাবে সক্রিয় করা হয়েছে!'
          : 'Member enrolled into loyalty program successfully!'
      );
      setIsEnrollModalOpen(false);
      setSelectedExistingCustomer(null);
      setCustomerSearchQuery('');
      setEnrollForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        membership_tier: 'Regular',
        initial_points: settingsData.welcome_bonus_points || 20,
        member_code: '',
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to enroll member');
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  // Handle Point Adjustment
  const handlePointAdjustSubmit = async (e) => {
    e.preventDefault();
    const pointsNum = Number(pointAdjustModal.points);
    if (!pointsNum || pointsNum <= 0) {
      toast.error(lang === 'bn' ? 'সঠিক পয়েন্ট সংখ্যা দিন।' : 'Please enter a valid positive points amount.');
      return;
    }

    setPointAdjustModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await api.membership.adjustPoints(pointAdjustModal.member._id, {
        points: pointsNum,
        type: pointAdjustModal.type,
        reason: pointAdjustModal.reason,
      });

      toast.success(
        lang === 'bn'
          ? `পয়েন্ট সফলভাবে ${pointAdjustModal.type === 'add' ? 'যোগ' : 'কর্তন'} করা হয়েছে!`
          : `Points successfully ${pointAdjustModal.type === 'add' ? 'added' : 'deducted'}!`
      );
      setPointAdjustModal({
        isOpen: false,
        member: null,
        type: 'add',
        points: '',
        reason: '',
        isSubmitting: false,
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust points');
      setPointAdjustModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Handle Remove Membership
  const handleRemoveMembershipConfirm = async () => {
    if (!deleteConfirm.memberId) return;

    setDeleteConfirm((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await api.membership.removeMembership(deleteConfirm.memberId);
      toast.success(
        lang === 'bn'
          ? 'মেম্বারশিপ স্ট্যাটাস সফলভাবে বাতিল করা হয়েছে।'
          : 'Membership removed successfully.'
      );
      setDeleteConfirm({ isOpen: false, memberId: null, memberName: '', isSubmitting: false });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove membership');
      setDeleteConfirm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const pointMonetaryWorth = (points) => {
    const rate = Number(settingsData.point_redeem_value) || 0.5;
    return (Number(points || 0) * rate).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER SECTION                                */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <Crown className="w-6 h-6 text-[#00df89] shrink-0" />
            <span>{lang === 'bn' ? 'মেম্বারশিপ ও লয়্যালটি প্রোগ্রাম' : 'Members & Loyalty Rewards'}</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                settingsData.enabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
              }`}
            >
              {settingsData.enabled ? (lang === 'bn' ? 'সক্রিয়' : 'Active') : (lang === 'bn' ? 'নিষ্ক্রিয়' : 'Disabled')}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-normal mt-0.5">
            {lang === 'bn'
              ? 'গ্রাহকদের মেম্বারশিপ, রিওয়ার্ড পয়েন্ট, টিয়ার রুলস এবং ভিআইপি ডিসকাউন্ট পরিচালনা করুন'
              : 'Manage loyalty customers, tier rules, reward points, and VIP billing discounts.'}
          </p>
        </div>

        {/* Top Actions & Tab Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl flex items-center border border-slate-200/80 dark:border-zinc-800 shrink-0">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'members'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{lang === 'bn' ? 'সদস্য তালিকা' : 'Member Directory'}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{lang === 'bn' ? 'রুলস ও সেটিংস' : 'Rules & Settings'}</span>
            </button>
          </div>

          {activeTab === 'members' && (
            <Button
              onClick={handleOpenEnrollModal}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs sm:text-sm h-10 px-4 gap-2 shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span className="whitespace-nowrap">{lang === 'bn' ? 'নতুন মেম্বার যুক্ত করুন' : 'Enroll Member'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. KPI METRIC CARDS OVERVIEW                         */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
              {lang === 'bn' ? 'মোট নিবন্ধিত মেম্বার' : 'Total VIP Members'}
            </span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isLoading ? <Skeleton className="h-8 w-16 my-0.5" /> : stats.total_members.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'লয়্যালটি প্রোগ্রামের সক্রিয় সদস্য' : 'Active loyalty customers'}
          </div>
        </Card>

        {/* If percentage discount mode: show discount-centric stats; otherwise points stats */}
        {(settingsData.reward_type === 'discount') ? (
          <>
            {/* Active Tiers */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'মোট সক্রিয় টিয়ার' : 'Active Tiers'}
                </span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
                {activeTiers.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'মেম্বারশিপ লেভেল কনফিগার করা' : 'Configured membership levels'}
              </div>
            </Card>

            {/* Max Discount Rate */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'সর্বোচ্চ টিয়ার ছাড়' : 'Highest Tier Discount'}
                </span>
                <Percent className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                {Math.max(0, ...activeTiers.map((t) => Number(t.extra_discount_percent) || 0))}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'ভিআইপি গ্রাহকদের সর্বোচ্চ ছাড়' : 'Max bill discount available'}
              </div>
            </Card>

            {/* Mode Indicator */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'প্রোগ্রাম মডেল' : 'Program Model'}
                </span>
                <Sparkles className="w-4 h-4 text-[#00a86b] dark:text-[#00df89]" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
                {lang === 'bn' ? 'শতাংশ ছাড়' : 'Auto Discount'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'চেকআউটে সরাসরি বিল ছাড়' : 'Instant % discount at checkout'}
              </div>
            </Card>
          </>
        ) : (
          <>
            {/* Points in Circulation */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'উপলব্ধ রিওয়ার্ড পয়েন্ট' : 'Points In Circulation'}
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2 flex items-baseline gap-1.5">
                {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : (
                  <>
                    <span>{stats.total_points.toLocaleString()}</span>
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </>
                )}
              </div>
              <div className="text-xs text-emerald-600 dark:text-[#00df89] mt-1 font-medium">
                ≈ ৳ {pointMonetaryWorth(stats.total_points)} {lang === 'bn' ? 'মূল্যমান' : 'discount value'}
              </div>
            </Card>

            {/* Total Earned */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'সর্বমোট অর্জিত পয়েন্ট' : 'Lifetime Points Earned'}
                </span>
                <Coins className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2 flex items-baseline gap-1.5">
                {isLoading ? <Skeleton className="h-8 w-24 my-0.5" /> : (
                  <>
                    <span>{stats.total_points_earned.toLocaleString()}</span>
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'bn' ? 'কেনাকাটায় গ্রাহকরা পেয়েছেন' : 'Awarded from sales volume'}
              </div>
            </Card>

            {/* Points Redeemed & Discount Given */}
            <Card className="p-4 sm:p-5 border-slate-200/90 dark:border-zinc-800/80 dark:bg-[#121215]">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {lang === 'bn' ? 'সর্বমোট রিডিম ও ছাড়' : 'Redeemed & Discounts'}
                </span>
                <DollarSign className="w-4 h-4 text-[#00a86b] dark:text-[#00df89]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#00a86b] dark:text-[#00df89] mt-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-28 my-0.5" />
                ) : (
                  `৳ ${(Number(stats.total_discount_amount) > 0 ? stats.total_discount_amount : (Number(stats.total_points_redeemed || 0) * (Number(settingsData.point_redeem_value) || 0.5))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {(stats.total_points_redeemed || 0).toLocaleString()} {lang === 'bn' ? 'পয়েন্ট থেকে ছাড়' : 'pts redeemed so far'}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TAB 1: MEMBERS DIRECTORY                          */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* SEARCH & FILTER BAR */}
          <Card className="p-3 sm:p-4 bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    lang === 'bn'
                      ? 'নাম, মোবাইল নম্বর বা মেম্বার কোড (MEM-XXXX) দিয়ে খুঁজুন...'
                      : 'Search member by name, phone or member code (MEM-XXXX)...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#00df89]"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-40 shrink-0">
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger className="w-full text-xs h-9 dark:bg-zinc-900/80 border-slate-200 dark:border-zinc-800">
                      <SelectValue placeholder="All Tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{lang === 'bn' ? 'সকল টিয়ার' : 'All Tiers'}</SelectItem>
                      {activeTiers.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="h-9 px-3 text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>

          {/* MEMBERS TABLE */}
          <Card className="bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/90 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#00df89]" />
                {lang === 'bn' ? 'সদস্য তথ্য লোড হচ্ছে...' : 'Loading member directory...'}
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'কোনো মেম্বার পাওয়া যায়নি' : 'No Members Enrolled Yet'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                  {lang === 'bn'
                    ? 'আপনার নিয়মিত গ্রাহকদের মেম্বার হিসেবে যুক্ত করে রিওয়ার্ড সুবিধা দেওয়া শুরু করুন।'
                    : 'Enroll customers into the loyalty program to reward benefits on every purchase.'}
                </p>
                <Button
                  onClick={handleOpenEnrollModal}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {lang === 'bn' ? 'প্রথম মেম্বার যুক্ত করুন' : 'Enroll First Member'}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50/80 dark:bg-zinc-900/60 border-b border-slate-200/80 dark:border-zinc-800/80 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'মেম্বার বিবরণ' : 'Member Profile'}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'টিয়ার ও কোড' : 'Tier & Card'}</th>
                      {settingsData.reward_type === 'discount' ? (
                        <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'টিয়ার ডিসকাউন্ট' : 'Tier Auto Discount'}</th>
                      ) : (
                        <>
                          <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'রিওয়ার্ড পয়েন্ট' : 'Reward Points'}</th>
                          <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'ডিসকাউন্ট মূল্য' : 'Redeemable Value'}</th>
                        </>
                      )}
                      <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'মোট কেনাকাটা' : 'Total Spent'}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap">{lang === 'bn' ? 'যোগদানের তারিখ' : 'Member Since'}</th>
                      <th className="px-4 py-3.5 whitespace-nowrap text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                    {paginatedMembers.map((m) => {
                      const matchedTier = activeTiers.find(
                        (t) => (t.name || '').toLowerCase() === (m.membership_tier || '').toLowerCase()
                      );
                      const tierColor = matchedTier?.color || '#10b981';
                      const tierBadgeStyle = getTierBadgeStyle(tierColor);
                      const points = Number(m.reward_points || 0);
                      const discountValue = pointMonetaryWorth(points);
                      const tierDiscount = matchedTier?.extra_discount_percent ?? 0;
                      const initials = (m.name || 'M')
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          {/* Member Profile with Initials Avatar */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span className="truncate">{m.name}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono mt-0.5">
                                  {m.phone || 'No phone'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tier & Card Code */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="space-y-1">
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors shadow-2xs"
                                style={tierBadgeStyle}
                              >
                                <Sparkles className="w-2.5 h-2.5" style={{ color: tierColor }} />
                                {m.membership_tier || 'Regular'}
                              </span>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                {m.member_code || `MEM-${m._id?.slice(-4).toUpperCase()}`}
                              </div>
                            </div>
                          </td>

                          {/* Columns based on Reward Model */}
                          {settingsData.reward_type === 'discount' ? (
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-bold text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5" />
                                <span>{tierDiscount}% {lang === 'bn' ? 'অটো ছাড়' : 'Auto Off'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {lang === 'bn' ? 'প্রতিটি কেনাকাটার বিলে' : 'On every checkout'}
                              </div>
                            </td>
                          ) : (
                            <>
                              {/* Reward Points */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                                    <span>{points.toLocaleString()}</span>
                                    <span className="text-[10px] font-normal text-slate-400">pts</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {lang === 'bn' ? 'অর্জিত:' : 'Lifetime:'} {(m.total_points_earned || points).toLocaleString()} pts
                                  </div>
                                </div>
                              </td>

                              {/* Redeemable Value */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <div className="font-semibold text-slate-900 dark:text-white text-xs">
                                  ৳ {discountValue}
                                </div>
                                <span className="text-[10px] text-emerald-600 dark:text-[#00df89] font-medium">
                                  {points >= (settingsData.min_points_to_redeem || 50)
                                    ? (lang === 'bn' ? '✓ রিডিমযোগ্য' : '✓ Ready to redeem')
                                    : (lang === 'bn' ? `ন্যূনতম ${settingsData.min_points_to_redeem} pts প্রয়োজন` : `Min ${settingsData.min_points_to_redeem} pts needed`)}
                                </span>
                              </td>
                            </>
                          )}

                          {/* Total Spent */}
                          <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-zinc-200 whitespace-nowrap">
                            ৳ {(m.total_spent ?? m.total_purchases ?? 0).toLocaleString()}
                            <div className="text-[10px] text-slate-400 font-normal">
                              {m.total_orders || 0} {lang === 'bn' ? 'অর্ডার' : 'orders'}
                            </div>
                          </td>

                          {/* Member Since */}
                          <td className="px-4 py-3.5 text-slate-500 dark:text-zinc-400 text-[11px] whitespace-nowrap">
                            {m.member_since
                              ? new Date(m.member_since).toLocaleDateString()
                              : m.created_at
                              ? new Date(m.created_at).toLocaleDateString()
                              : 'N/A'}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Adjust Points Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setPointAdjustModal({
                                    isOpen: true,
                                    member: m,
                                    type: 'add',
                                    points: '',
                                    reason: '',
                                    isSubmitting: false,
                                  })
                                }
                                className="h-7.5 px-2.5 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer"
                                title="Add/Deduct Points"
                              >
                                <Coins className="w-3 h-3 mr-1" />
                                <span>{lang === 'bn' ? 'পয়েন্ট' : 'Points'}</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/customers?search=${encodeURIComponent(m.phone || m.name)}`)}
                                className="h-7.5 px-2 text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="View Customer Profile"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    isOpen: true,
                                    memberId: m._id,
                                    memberName: m.name,
                                    isSubmitting: false,
                                  })
                                }
                                className="w-7.5 h-7.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                title="Remove Membership"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <Pagination
                  currentPage={currentPage}
                  totalItems={members.length}
                  pageSize={pageSize}
                  pageSizeOptions={[10, 20, 50, 100]}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. TAB 2: RULES & PROGRAM SETTINGS                   */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Card 1: Master Program Activation */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/90 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'লয়্যালটি ও মেম্বারশিপ প্রোগ্রাম স্ট্যাটাস' : 'Loyalty Program Activation'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {lang === 'bn'
                    ? 'মেম্বারশিপ চালু থাকলে বিলিং ও কাস্টমার পাতায় মেম্বার ব্যাজ, রিওয়ার্ড পয়েন্ট, টিয়ার স্বয়ংক্রিয় ডিসকাউন্ট ও পয়েন্ট রিডিম সক্রিয় থাকবে।'
                    : 'When enabled, customers in membership tiers earn rewards, receive automatic discounts, and can redeem loyalty points during checkout.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settingsData.enabled}
                  onChange={(e) => setSettingsData({ ...settingsData, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00df89]"></div>
              </label>
            </div>
          </Card>

          {/* Card 2: Tier-Specific Multipliers & Privileges */}
          <Card className="p-5 sm:p-6 bg-white dark:bg-[#121215] border-slate-200/90 dark:border-zinc-800/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'bn' ? 'মেম্বারশিপ টিয়ার ও রিওয়ার্ড নিয়মাবলী' : 'Membership Tiers & Reward Rules'}</span>
                  <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold">
                    {(settingsData.tiers || DEFAULT_TIERS).length} Tiers
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {lang === 'bn'
                    ? 'প্রতিটি মেম্বারশিপ টিয়ারের জন্য স্বয়ংক্রিয় বিল ছাড়, বোনাস পয়েন্ট, টাকার খরচ হার ও পয়েন্টের মান নির্ধারণ করুন।'
                    : 'Configure automatic invoice discounts, welcome bonus points, spend rate, point earnings, and point value per tier.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefaultTiers}
                  className="h-8 px-2.5 text-xs text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  <span>{lang === 'bn' ? 'রিসেট' : 'Reset Defaults'}</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTier}
                  className="h-8 px-3 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-[#00df89] border border-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>{lang === 'bn' ? 'নতুন টিয়ার' : 'Add Custom Tier'}</span>
                </Button>
              </div>
            </div>

            {/* Tier Rows List */}
            <div className="space-y-4">
              {(settingsData.tiers && settingsData.tiers.length > 0 ? settingsData.tiers : DEFAULT_TIERS).map((tier, idx) => {
                const extraDiscount = Number(tier.extra_discount_percent) || 0;
                const welcomeBonus = Number(tier.welcome_bonus_points) || 0;
                const tierSpend = Number(tier.earn_spend_unit) || 0;
                const earnRate = Number(tier.earn_points_per_unit) || 0;
                const redeemVal = Number(tier.point_redeem_value) || 0;
                const minRedeem = Number(tier.min_points_to_redeem) || 0;

                const hasDiscount = extraDiscount > 0;
                const hasBonus = welcomeBonus > 0;
                const hasEarnPoints = tierSpend > 0 && earnRate > 0;
                const hasRedeem = redeemVal > 0;

                const simEarn1000 = hasEarnPoints ? Math.floor(1000 / tierSpend) * earnRate : 0;
                const simRedeem100 = hasRedeem ? 100 * redeemVal : 0;

                // Build active benefits list dynamically from user input
                const benefits = [];
                if (hasDiscount) {
                  benefits.push({
                    key: 'discount',
                    text: lang === 'bn' ? `${extraDiscount}% স্বয়ংক্রিয় বিল ছাড়` : `${extraDiscount}% auto invoice discount`,
                    className: 'font-semibold text-cyan-600 dark:text-cyan-400',
                  });
                }
                if (hasBonus && !hasDiscount) {
                  benefits.push({
                    key: 'welcome',
                    text: lang === 'bn' ? `+${welcomeBonus} ওয়েলকাম বোনাস পয়েন্ট` : `+${welcomeBonus} welcome bonus pts`,
                    className: 'font-semibold text-amber-600 dark:text-amber-400',
                  });
                }
                if (hasEarnPoints) {
                  benefits.push({
                    key: 'earn',
                    text: lang === 'bn'
                      ? `প্রতি ৳${tierSpend} খরচ = ${earnRate} পয়েন্ট (৳১,০০০ কেনাকাটায় +${simEarn1000} পয়েন্ট)`
                      : `Spend ৳${tierSpend} = ${earnRate} pt (৳1,000 spend → +${simEarn1000} pts)`,
                    className: 'text-slate-700 dark:text-zinc-300',
                  });
                }
                if (hasRedeem) {
                  const minNote = minRedeem > 0 ? (lang === 'bn' ? ` (ন্যূনতম ${minRedeem} পয়েন্ট)` : ` (Min ${minRedeem} pts)`) : '';
                  benefits.push({
                    key: 'redeem',
                    text: lang === 'bn'
                      ? `১০০ পয়েন্ট = ৳${simRedeem100.toFixed(2)} ছাড়${minNote}`
                      : `100 pts = ৳${simRedeem100.toFixed(2)} off${minNote}`,
                    className: 'text-slate-700 dark:text-zinc-300',
                  });
                }

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3.5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: tier.color || '#10b981' }}
                        />
                        <input
                          type="text"
                          required
                          value={tier.name}
                          onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                          placeholder="Tier Name (e.g. Gold)"
                          className="font-bold text-sm text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-zinc-700 focus:border-[#00df89] outline-none px-1 py-0.5 w-36 sm:w-48"
                        />
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 bg-slate-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                          Tier #{idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px]">
                          <span className="text-slate-400 text-[10px]">{lang === 'bn' ? 'রং' : 'Color'}:</span>
                          <input
                            type="color"
                            value={tier.color || '#10b981'}
                            onChange={(e) => handleTierChange(idx, 'color', e.target.value)}
                            className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent"
                            title="Choose Tier Color"
                          />
                        </div>

                        {(settingsData.tiers || DEFAULT_TIERS).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Remove Tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6 Clean Inputs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                      {/* 1. Auto Invoice Discount (%) */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-cyan-500" />
                          {lang === 'bn' ? 'অটো ছাড় (%)' : 'Auto Discount (%)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0"
                            value={tier.extra_discount_percent ?? ''}
                            onChange={(e) => handleTierChange(idx, 'extra_discount_percent', e.target.value)}
                            className="w-full pl-3 pr-6 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      {/* 2. Welcome Bonus Points (N/A for %-based tiers) */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <Gift className="w-3 h-3 text-amber-500" />
                          {lang === 'bn' ? 'ওয়েলকাম বোনাস' : 'Welcome Bonus'}
                        </label>
                        {Number(tier.extra_discount_percent) > 0 ? (
                          <div className="relative">
                            <input
                              type="text"
                              disabled
                              value="N/A (% Tier)"
                              title={lang === 'bn' ? '% ভিত্তিক টিয়ারে বোনাস পয়েন্ট প্রযোজ্য নয়' : 'Welcome bonus points not applicable for % discount tiers'}
                              className="w-full px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-mono text-[11px] cursor-not-allowed text-center"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={tier.welcome_bonus_points ?? ''}
                              onChange={(e) => handleTierChange(idx, 'welcome_bonus_points', e.target.value)}
                              className="w-full pl-3 pr-7 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">pts</span>
                          </div>
                        )}
                      </div>

                      {/* 3. Spend Rate (৳) */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-500" />
                          {lang === 'bn' ? 'খরচ (৳)' : 'Spend (৳)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">৳</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={tier.earn_spend_unit ?? ''}
                            onChange={(e) => handleTierChange(idx, 'earn_spend_unit', e.target.value)}
                            className="w-full pl-6 pr-2 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                          />
                        </div>
                      </div>

                      {/* 4. Points Earned */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-purple-500" />
                          {lang === 'bn' ? 'পয়েন্ট অর্জন' : 'Earn (pts)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={tier.earn_points_per_unit ?? ''}
                            onChange={(e) => handleTierChange(idx, 'earn_points_per_unit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">pts</span>
                        </div>
                      </div>

                      {/* 5. 1 Pt Value (৳) */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-emerald-500" />
                          {lang === 'bn' ? '১ পয়েন্ট মূল্য' : '1 Pt Value (৳)'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={tier.point_redeem_value ?? ''}
                            onChange={(e) => handleTierChange(idx, 'point_redeem_value', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">৳</span>
                        </div>
                      </div>

                      {/* 6. Min Redeem Points */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {lang === 'bn' ? 'ন্যূনতম রিডিম' : 'Min Redeem'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={tier.min_points_to_redeem ?? ''}
                            onChange={(e) => handleTierChange(idx, 'min_points_to_redeem', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Live Simulation Line */}
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-slate-200/80 dark:border-zinc-800/80 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-zinc-400 min-h-[36px]">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>💡 {tier.name || `Tier #${idx + 1}`}:</span>
                      </span>
                      {benefits.length > 0 ? (
                        benefits.map((b, bIdx) => (
                          <div key={b.key} className="inline-flex items-center gap-2">
                            {bIdx > 0 && <span className="text-slate-300 dark:text-zinc-700">•</span>}
                            <span className={b.className}>{b.text}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">
                          {lang === 'bn' ? 'কোনো ডিসকাউন্ট বা পয়েন্ট সুবিধা যোগ করা হয়নি।' : 'No benefits configured for this tier yet.'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingSettings}
              className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] text-xs font-semibold px-6 py-2.5 gap-1.5 shadow-xs cursor-pointer"
            >
              {isSavingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{lang === 'bn' ? 'সেটিংস সংরক্ষণ করুন' : 'Save Program Rules'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. MODAL: ENROLL MEMBER                              */}
      {/* ---------------------------------------------------- */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-lg w-full bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'মেম্বারশিপ যুক্ত করুন' : 'Enroll VIP Member'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'কাস্টমার তালিকা থেকে বা নতুন যুক্ত করে রিওয়ার্ড পয়েন্ট দিন' : 'Register member into loyalty program'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEnrollModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleEnrollSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {/* Mode Switcher: Existing Customer vs New Customer */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollMode('existing');
                    fetchExistingCustomers();
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    enrollMode === 'existing'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-[#00df89]" />
                  <span>{lang === 'bn' ? 'কাস্টমার তালিকা থেকে' : 'From Customer List'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEnrollMode('new');
                    setSelectedExistingCustomer(null);
                    setEnrollForm({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      membership_tier: 'Regular',
                      initial_points: settingsData.welcome_bonus_points || 20,
                      member_code: '',
                    });
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    enrollMode === 'new'
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>{lang === 'bn' ? 'নতুন কাস্টমার তৈরি' : 'Create New Customer'}</span>
                </button>
              </div>

              {/* TAB A: SELECT FROM EXISTING CUSTOMER LIST */}
              {enrollMode === 'existing' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {!selectedExistingCustomer ? (
                    <div className="space-y-2">
                      <label className="font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-[#00df89]" />
                          {lang === 'bn' ? 'কাস্টমার খুঁজুন (নাম বা মোবাইল নম্বর)' : 'Search Customer (Name or Phone)'}
                        </span>
                        {isLoadingExistingCustomers && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin text-[#00df89]" />
                            Loading...
                          </span>
                        )}
                      </label>

                      {/* Search Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={lang === 'bn' ? 'নাম বা ফোন নম্বর লিখুন (যেমন: 017...)' : 'Type customer name or phone number (e.g. 017...)'}
                          value={customerSearchQuery}
                          onChange={(e) => {
                            setCustomerSearchQuery(e.target.value);
                            setShowExistingCustomerDropdown(true);
                          }}
                          onFocus={() => setShowExistingCustomerDropdown(true)}
                          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-1 focus:ring-[#00df89]"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        {customerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCustomerSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Customer List Box */}
                      <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/50 max-h-48 overflow-y-auto p-1.5 space-y-1">
                        {filteredExistingCustomers.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            {customerSearchQuery
                              ? (lang === 'bn' ? 'এই নামে বা নম্বরে কোনো সাধারণ কাস্টমার পাওয়া যায়নি।' : 'No matching non-member customers found.')
                              : (lang === 'bn' ? 'সকল কাস্টমার ইতিমধ্যে মেম্বারশিপে যুক্ত আছেন অথবা কোনো কাস্টমার নেই।' : 'All customers are already enrolled or no customers available.')}
                          </div>
                        ) : (
                          filteredExistingCustomers.map((c) => {
                            const initials = (c.name || 'C')
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();
                            const spent = c.totalSpent || c.total_spent || 0;
                            const orders = c.totalOrders || c.total_orders || 0;

                            return (
                              <div
                                key={c._id}
                                onClick={() => handleSelectExistingCustomer(c)}
                                className="p-2.5 rounded-lg bg-white dark:bg-[#18181b] hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 border border-slate-100 dark:border-zinc-800/80 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-bold text-xs shrink-0">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                                      {c.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                                      <span>{c.phone || 'No phone'}</span>
                                      {c.address && <span className="truncate max-w-[140px]">· {c.address}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0 text-[10px]">
                                  <div className="font-semibold text-emerald-600 dark:text-[#00df89]">
                                    ৳ {spent.toLocaleString()}
                                  </div>
                                  <div className="text-slate-400">
                                    {orders} {lang === 'bn' ? 'অর্ডার' : 'orders'}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Selected Customer Profile Card */
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-emerald-500/40 space-y-2 relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-[#00a86b] dark:text-[#00df89] border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[#00df89]" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                              {selectedExistingCustomer.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                              {selectedExistingCustomer.phone || 'No phone'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExistingCustomer(null);
                            setCustomerSearchQuery('');
                          }}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Membership Tier & Optional Card/Points for Selected Customer */}
                  {(() => {
                    const currentEnrollTier = activeTiers.find((t) => t.name === (enrollForm.membership_tier || activeTiers[0]?.name)) || activeTiers[0];
                    const isEnrollTierPercent = Number(currentEnrollTier?.extra_discount_percent) > 0;

                    return (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700 dark:text-zinc-300">
                              {lang === 'bn' ? 'মেম্বারশিপ টিয়ার' : 'Membership Tier'}
                            </label>
                            <Select
                              value={enrollForm.membership_tier || activeTiers[0]?.name || 'Regular'}
                              onValueChange={(val) => {
                                const selectedTier = activeTiers.find((t) => t.name === val);
                                const isPercent = Number(selectedTier?.extra_discount_percent) > 0;
                                setEnrollForm({
                                  ...enrollForm,
                                  membership_tier: val,
                                  initial_points: isPercent ? 0 : (selectedTier?.welcome_bonus_points !== undefined ? selectedTier.welcome_bonus_points : 0),
                                });
                              }}
                            >
                              <SelectTrigger className="w-full h-9.5 text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                                <SelectValue placeholder="Tier" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeTiers.map((t) => (
                                  <SelectItem key={t.name} value={t.name}>
                                    {t.name} {t.extra_discount_percent ? `(${t.extra_discount_percent}% off)` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {isEnrollTierPercent ? (
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 dark:text-zinc-300">
                                {lang === 'bn' ? 'মেম্বারশিপ সুবিধা' : 'Tier Benefit'}
                              </label>
                              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
                                <Percent className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                <span>{currentEnrollTier?.extra_discount_percent}% {lang === 'bn' ? 'অটো ডিসকাউন্ট' : 'Auto Discount'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <label className="font-semibold text-slate-700 dark:text-zinc-300">
                                {lang === 'bn' ? 'স্বাগতম বোনাস পয়েন্ট' : 'Welcome Bonus Points'}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🎁</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={enrollForm.initial_points}
                                  onChange={(e) => setEnrollForm({ ...enrollForm, initial_points: e.target.value })}
                                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700 dark:text-zinc-300">
                            {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. MEM-00101"
                            value={enrollForm.member_code}
                            onChange={(e) => setEnrollForm({ ...enrollForm, member_code: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB B: CREATE BRAND NEW CUSTOMER */}
              {enrollMode === 'new' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'সদস্যের নাম *' : 'Member Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Ahmed"
                      value={enrollForm.name}
                      onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-zinc-300">
                        {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        value={enrollForm.phone}
                        onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-zinc-300">
                        {lang === 'bn' ? 'মেম্বারশিপ টিয়ার' : 'Membership Tier'}
                      </label>
                      <Select
                        value={enrollForm.membership_tier || activeTiers[0]?.name || 'Regular'}
                        onValueChange={(val) => {
                          const selectedTier = activeTiers.find((t) => t.name === val);
                          const isPercent = Number(selectedTier?.extra_discount_percent) > 0;
                          setEnrollForm({
                            ...enrollForm,
                            membership_tier: val,
                            initial_points: isPercent ? 0 : (selectedTier?.welcome_bonus_points !== undefined ? selectedTier.welcome_bonus_points : 0),
                          });
                        }}
                      >
                        <SelectTrigger className="w-full h-9.5 text-xs dark:bg-zinc-900 border-slate-200 dark:border-zinc-800">
                          <SelectValue placeholder="Tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeTiers.map((t) => (
                            <SelectItem key={t.name} value={t.name}>
                              {t.name} {t.extra_discount_percent ? `(${t.extra_discount_percent}% off)` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(() => {
                    const currentEnrollTier = activeTiers.find((t) => t.name === (enrollForm.membership_tier || activeTiers[0]?.name)) || activeTiers[0];
                    const isEnrollTierPercent = Number(currentEnrollTier?.extra_discount_percent) > 0;

                    if (isEnrollTierPercent) {
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700 dark:text-zinc-300">
                              {lang === 'bn' ? 'মেম্বারশিপ সুবিধা' : 'Tier Benefit'}
                            </label>
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-semibold">
                              <Percent className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                              <span>{currentEnrollTier?.extra_discount_percent}% {lang === 'bn' ? 'অটো ডিসকাউন্ট' : 'Auto Discount'}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-slate-700 dark:text-zinc-300">
                              {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                            </label>
                            <input
                              type="text"
                              placeholder="MEM-00101"
                              value={enrollForm.member_code}
                              onChange={(e) => setEnrollForm({ ...enrollForm, member_code: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700 dark:text-zinc-300">
                            {lang === 'bn' ? 'স্বাগতম বোনাস পয়েন্ট' : 'Welcome Bonus Points'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🎁</span>
                            <input
                              type="number"
                              min="0"
                              value={enrollForm.initial_points}
                              onChange={(e) => setEnrollForm({ ...enrollForm, initial_points: e.target.value })}
                              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700 dark:text-zinc-300">
                            {lang === 'bn' ? 'মেম্বার কার্ড কোড (ঐচ্ছিক)' : 'Member Card Code (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="MEM-00101"
                            value={enrollForm.member_code}
                            onChange={(e) => setEnrollForm({ ...enrollForm, member_code: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-zinc-300">
                      {lang === 'bn' ? 'ঠিকানা (ঐচ্ছিক)' : 'Address (Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi, Dhaka"
                      value={enrollForm.address}
                      onChange={(e) => setEnrollForm({ ...enrollForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEnrollModalOpen(false)}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEnroll || (enrollMode === 'existing' && !selectedExistingCustomer)}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmittingEnroll && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'মেম্বারশিপ চালু করুন' : 'Confirm Enrollment'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. MODAL: ADJUST POINTS                              */}
      {/* ---------------------------------------------------- */}
      {pointAdjustModal.isOpen && pointAdjustModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-xs">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'পয়েন্ট সমন্বয় করুন' : 'Adjust Reward Points'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {pointAdjustModal.member.name} ({pointAdjustModal.member.reward_points || 0} pts)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPointAdjustModal({ isOpen: false, member: null, type: 'add', points: '', reason: '', isSubmitting: false })}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePointAdjustSubmit} className="p-6 space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPointAdjustModal({ ...pointAdjustModal, type: 'add' })}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    pointAdjustModal.type === 'add'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  + {lang === 'bn' ? 'পয়েন্ট যোগ করুন' : 'Add Points'}
                </button>
                <button
                  type="button"
                  onClick={() => setPointAdjustModal({ ...pointAdjustModal, type: 'deduct' })}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    pointAdjustModal.type === 'deduct'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  - {lang === 'bn' ? 'পয়েন্ট কাটুন' : 'Deduct Points'}
                </button>
              </div>

              {/* Point input */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'পয়েন্টের পরিমাণ *' : 'Points Amount *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={pointAdjustModal.points}
                  onChange={(e) => setPointAdjustModal({ ...pointAdjustModal, points: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              {/* Reason Note */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-zinc-300">
                  {lang === 'bn' ? 'কারণ / নোট (ঐচ্ছিক)' : 'Reason / Note (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer appreciation gift / correction"
                  value={pointAdjustModal.reason}
                  onChange={(e) => setPointAdjustModal({ ...pointAdjustModal, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Balance Preview */}
              {Number(pointAdjustModal.points) > 0 && (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    {lang === 'bn' ? 'নতুন ব্যালেন্স:' : 'New Balance:'}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {pointAdjustModal.type === 'add'
                      ? (Number(pointAdjustModal.member.reward_points || 0) + Number(pointAdjustModal.points)).toLocaleString()
                      : Math.max(0, Number(pointAdjustModal.member.reward_points || 0) - Number(pointAdjustModal.points)).toLocaleString()}{' '}
                    pts (≈ ৳ {pointMonetaryWorth(
                      pointAdjustModal.type === 'add'
                        ? Number(pointAdjustModal.member.reward_points || 0) + Number(pointAdjustModal.points)
                        : Math.max(0, Number(pointAdjustModal.member.reward_points || 0) - Number(pointAdjustModal.points))
                    )})
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPointAdjustModal({ isOpen: false, member: null, type: 'add', points: '', reason: '', isSubmitting: false })}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={pointAdjustModal.isSubmitting}
                  className="bg-[#00df89] hover:bg-[#00c97b] text-[#011812] font-semibold text-xs gap-1.5 cursor-pointer"
                >
                  {pointAdjustModal.isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'bn' ? 'সমন্বয় সম্পন্ন করুন' : 'Confirm Points'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. CONFIRM DELETE MEMBERSHIP DIALOG                  */}
      {/* ---------------------------------------------------- */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={lang === 'bn' ? 'মেম্বারশিপ বাতিল নিশ্চিত করুন' : 'Remove Membership Status?'}
        description={
          lang === 'bn'
            ? `আপনি কি নিশ্চিত যে "${deleteConfirm.memberName}" এর মেম্বারশিপ বাতিল করতে চান? কাস্টমার প্রোফাইল অক্ষত থাকবে কিন্তু রিওয়ার্ড পয়েন্ট বন্ধ হবে।`
            : `Are you sure you want to remove membership from "${deleteConfirm.memberName}"? The customer profile will remain, but reward points and VIP perks will be disabled.`
        }
        confirmText={lang === 'bn' ? 'হ্যাঁ, মেম্বারশিপ বাতিল করুন' : 'Yes, Remove Membership'}
        confirmVariant="danger"
        isLoading={deleteConfirm.isSubmitting}
        onConfirm={handleRemoveMembershipConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, memberId: null, memberName: '', isSubmitting: false })}
      />
    </div>
  );
}
