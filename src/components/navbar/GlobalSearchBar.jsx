/**
 * @file GlobalSearchBar.jsx
 * @description Universal, business-type-aware live search & quick-jump command palette for Shopo.
 * Supports all business types (Retail, Restaurant, Gym, Pharmacy, Grocery, etc.), recent 5 searches,
 * smart suggestions, Bengali & English fuzzy search, and keyboard navigation (Cmd+K).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Clock,
  X,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  UserCheck,
  FileBarChart,
  Store,
  User,
  Crown,
  Building2,
  ShieldCheck,
  Flame,
  LayoutGrid,
  Utensils,
  Calendar,
  Layers,
  Receipt,
  BarChart3,
  Sliders,
  Dumbbell,
  CreditCard,
  Plus,
  Command,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';

const MAX_RECENT = 5;

export default function GlobalSearchBar({ className }) {
  const navigate = useNavigate();
  const { mongoShop, mongoUser } = useAuth();
  const { activeShop } = useShop();
  const { lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Accurately Detect Active Business Type from Auth & Shop Context
  const rawShopType = (
    mongoShop?.business_type ||
    activeShop?.id ||
    mongoShop?.shop_type ||
    'retail'
  ).toLowerCase();

  const isRestaurant =
    rawShopType === 'restaurant' ||
    rawShopType === 'cafe' ||
    rawShopType === 'food' ||
    rawShopType === 'bakery' ||
    rawShopType === 'fast_food';

  const isGym =
    rawShopType === 'gym' ||
    rawShopType === 'fitness' ||
    rawShopType === 'yoga' ||
    rawShopType === 'sports';

  const currentBusinessType = isRestaurant ? 'restaurant' : isGym ? 'gym' : rawShopType || 'retail';
  const recentStorageKey = `shopo_recent_searches_${currentBusinessType}`;

  // Load Recent Searches scoped to this specific business type
  useEffect(() => {
    try {
      const stored = localStorage.getItem(recentStorageKey);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      } else {
        setRecentSearches([]);
      }
    } catch {
      setRecentSearches([]);
    }
  }, [recentStorageKey]);

  // Save Recent Search
  const saveRecentSearch = (item) => {
    try {
      const filtered = recentSearches.filter((r) => r.path !== item.path && r.id !== item.id);
      const updated = [
        {
          id: item.id,
          title: item.title,
          titleBn: item.titleBn,
          path: item.path,
          category: item.category,
          categoryBn: item.categoryBn,
          iconName: item.iconName,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_RECENT);

      setRecentSearches(updated);
      localStorage.setItem(recentStorageKey, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  };

  // Remove single recent search
  const removeRecentSearch = (e, path) => {
    e.stopPropagation();
    const updated = recentSearches.filter((r) => r.path !== path);
    setRecentSearches(updated);
    try {
      localStorage.setItem(recentStorageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Clear all recent searches for this business type
  const clearAllRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(recentStorageKey);
    } catch {
      // ignore
    }
  };

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Comprehensive Searchable Index based on Business Type
  const allSearchablePages = useMemo(() => {
    if (isRestaurant) {
      return [
        {
          id: 'res-dash',
          title: 'Live Restaurant Dashboard',
          titleBn: 'লাইভ রেস্তোরাঁ ড্যাশবোর্ড',
          path: '/restaurant/dashboard',
          category: 'Operations',
          categoryBn: 'অপারেশনস',
          icon: LayoutDashboard,
          iconName: 'LayoutDashboard',
          keywords: ['restaurant', 'live', 'dashboard', 'sales', 'covers', 'ড্যাশবোর্ড', 'রেস্তোরাঁ'],
          suggested: true,
        },
        {
          id: 'res-pos',
          title: 'Restaurant POS Billing',
          titleBn: 'রেস্তোরাঁ পিওএস ও বিলিং',
          path: '/restaurant/pos',
          category: 'Sales & Billing',
          categoryBn: 'বিক্রি ও বিলিং',
          icon: ShoppingCart,
          iconName: 'ShoppingCart',
          keywords: ['pos', 'billing', 'kot', 'dine in', 'takeaway', 'delivery', 'ক্যাশ মেমো', 'বিল', 'অর্ডার', 'পিওএস'],
          badge: 'POS',
          suggested: true,
        },
        {
          id: 'res-tables',
          title: 'Floor Plan & Tables',
          titleBn: 'টেবিল ও ফ্লোর প্ল্যান',
          path: '/restaurant/tables',
          category: 'Operations',
          categoryBn: 'অপারেশনস',
          icon: LayoutGrid,
          iconName: 'LayoutGrid',
          keywords: ['table', 'floor', 'zones', 'seats', 'occupied', 'served', 'টেবিল', 'ফ্লোর'],
          badge: 'Tables',
          suggested: true,
        },
        {
          id: 'res-kds',
          title: 'Kitchen Display Screen (KDS)',
          titleBn: 'কিচেন ডিসপ্লে স্ক্রিন (KDS)',
          path: '/restaurant/kds',
          category: 'Kitchen',
          categoryBn: 'কিচেন',
          icon: Flame,
          iconName: 'Flame',
          keywords: ['kds', 'kitchen', 'cook', 'cooking', 'chef', 'kot', 'ready', 'served', 'কিচেন', 'রান্না'],
          badge: 'KDS',
          suggested: true,
        },
        {
          id: 'res-menu',
          title: 'Food Menu & Item Catalog',
          titleBn: 'খাবার মেনু ও আইটেম',
          path: '/restaurant/menu',
          category: 'Catalog',
          categoryBn: 'ক্যাটালগ',
          icon: Utensils,
          iconName: 'Utensils',
          keywords: ['menu', 'food', 'dishes', 'items', 'recipe', 'category', 'খাবার', 'মেনু'],
        },
        {
          id: 'res-reservations',
          title: 'Table Bookings & Reservations',
          titleBn: 'টেবিল বুকিং ও রিজার্ভেশন',
          path: '/restaurant/reservations',
          category: 'Guest Relations',
          categoryBn: 'অতিথি সেবা',
          icon: Calendar,
          iconName: 'Calendar',
          keywords: ['reservation', 'booking', 'guest', 'table book', 'বুকিং', 'রিজার্ভেশন'],
        },
        {
          id: 'res-recipes',
          title: 'Recipe BOM & Food Costing',
          titleBn: 'রেসিপি ও খাদ্য খরচ (BOM)',
          path: '/restaurant/recipes',
          category: 'Inventory & Cost',
          categoryBn: 'হিসাব ও খরচ',
          icon: Layers,
          iconName: 'Layers',
          keywords: ['recipe', 'bom', 'food cost', 'ingredients', 'রেসিপি', 'উপাদান'],
        },
        {
          id: 'res-inventory',
          title: 'Raw Materials & Pantry Stock',
          titleBn: 'কাঁচামাল ও প্যান্ট্রি ইনভেন্টরি',
          path: '/restaurant/inventory',
          category: 'Inventory & Stock',
          categoryBn: 'ইনভেন্টরি ও স্টক',
          icon: Package,
          iconName: 'Package',
          keywords: ['raw materials', 'pantry', 'stock', 'ingredients', 'কাঁচামাল', 'স্টক'],
        },
        {
          id: 'res-orders',
          title: 'Order History & Invoices',
          titleBn: 'অর্ডার ও চালান ইতিহাস',
          path: '/restaurant/orders',
          category: 'Sales & Billing',
          categoryBn: 'বিক্রি ও বিলিং',
          icon: Receipt,
          iconName: 'Receipt',
          keywords: ['orders', 'invoices', 'bills', 'history', 'চালান', 'অর্ডার ইতিহাস'],
        },
        {
          id: 'res-reports',
          title: 'Restaurant Analytics & Reports',
          titleBn: 'রেস্তোরাঁ অ্যানালিটিক্স ও রিপোর্ট',
          path: '/restaurant/reports',
          category: 'Finance & Analytics',
          categoryBn: 'হিসাব ও রিপোর্ট',
          icon: BarChart3,
          iconName: 'BarChart3',
          keywords: ['reports', 'analytics', 'profit', 'sales report', 'রিপোর্ট', 'অ্যানালিটিক্স'],
        },
        {
          id: 'customers',
          title: 'Customers & Diners',
          titleBn: 'কাস্টমার ও গ্রাহক তালিকা',
          path: '/customers',
          category: 'CRM',
          categoryBn: 'গ্রাহক',
          icon: Users,
          iconName: 'Users',
          keywords: ['customers', 'diners', 'due', 'ledger', 'কাস্টমার', 'গ্রাহক', 'বাকি'],
        },
        {
          id: 'members',
          title: 'Memberships & Loyalty Rewards',
          titleBn: 'মেম্বারশিপ ও রিওয়ার্ড',
          path: '/members',
          category: 'CRM',
          categoryBn: 'গ্রাহক',
          icon: Crown,
          iconName: 'Crown',
          keywords: ['members', 'loyalty', 'points', 'discounts', 'মেম্বার', 'পয়েন্ট'],
        },
        {
          id: 'purchases',
          title: 'Purchases & Stock Inward',
          titleBn: 'পণ্য ক্রয় (Purchases)',
          path: '/purchases',
          category: 'Supply Chain',
          categoryBn: 'সরবরাহ',
          icon: Package,
          iconName: 'Package',
          keywords: ['purchases', 'buy', 'stock in', 'ক্রয়', 'মাল ক্রয়'],
        },
        {
          id: 'suppliers',
          title: 'Suppliers & Vendors',
          titleBn: 'সাপ্লায়ার ও সরবরাহকারী',
          path: '/suppliers',
          category: 'Supply Chain',
          categoryBn: 'সরবরাহ',
          icon: Building2,
          iconName: 'Building2',
          keywords: ['suppliers', 'vendors', 'distributors', 'সাপ্লায়ার', 'মহাজন'],
        },
        {
          id: 'expenses',
          title: 'Business Expenses',
          titleBn: 'দোকানের খরচ (Expenses)',
          path: '/expenses',
          category: 'Finance & Accounts',
          categoryBn: 'হিসাব ও খরচ',
          icon: DollarSign,
          iconName: 'DollarSign',
          keywords: ['expenses', 'bills', 'rent', 'utility', 'খরচ', 'দোকানের খরচ'],
        },
        {
          id: 'employees',
          title: 'Employees & Payroll',
          titleBn: 'কর্মচারী ও বেতন',
          path: '/employees',
          category: 'Staff & HR',
          categoryBn: 'কর্মী ও বেতন',
          icon: UserCheck,
          iconName: 'UserCheck',
          keywords: ['employees', 'staff', 'salary', 'payroll', 'waiter', 'chef', 'কর্মচারী', 'বেতন'],
        },
        {
          id: 'financial-reports',
          title: 'Financial Reports & Accounting',
          titleBn: 'আর্থিক রিপোর্ট ও হিসাব',
          path: '/financial-reports',
          category: 'Finance & Accounts',
          categoryBn: 'হিসাব ও রিপোর্ট',
          icon: FileBarChart,
          iconName: 'FileBarChart',
          keywords: ['financial', 'accounting', 'balance sheet', 'profit loss', 'হিসাব', 'লাভ ক্ষতি'],
        },
        {
          id: 'res-settings',
          title: 'Restaurant System Settings',
          titleBn: 'রেস্তোরাঁ সেটিংস',
          path: '/restaurant/settings',
          category: 'Configuration',
          categoryBn: 'সেটিংস',
          icon: Sliders,
          iconName: 'Sliders',
          keywords: ['settings', 'vat', 'service charge', 'printers', 'kot', 'সেটিংস'],
        },
        {
          id: 'users',
          title: 'Users & Permissions',
          titleBn: 'ব্যবহারকারী ও অনুমতি',
          path: '/users',
          category: 'Security & Access',
          categoryBn: 'নিরাপত্তা',
          icon: ShieldCheck,
          iconName: 'ShieldCheck',
          keywords: ['users', 'roles', 'devices', 'pins', 'ইউজার', 'অনুমতি'],
        },
        {
          id: 'store-settings',
          title: 'Store Profile & Details',
          titleBn: 'দোকানের সেটিংস ও তথ্য',
          path: '/settings/store',
          category: 'Configuration',
          categoryBn: 'সেটিংস',
          icon: Store,
          iconName: 'Store',
          keywords: ['store', 'profile', 'address', 'logo', 'দোকান তথ্য'],
        },
      ];
    }

    if (isGym) {
      return [
        {
          id: 'gym-dash',
          title: 'Gym Dashboard',
          titleBn: 'জিমন্যাসিয়াম ড্যাশবোর্ড',
          path: '/gym/dashboard',
          category: 'Management',
          categoryBn: 'ব্যবস্থাপনা',
          icon: LayoutDashboard,
          iconName: 'LayoutDashboard',
          keywords: ['gym', 'dashboard', 'members', 'overview', 'ড্যাশবোর্ড', 'জিম'],
          suggested: true,
        },
        {
          id: 'gym-sales',
          title: 'Gym POS & Sales',
          titleBn: 'জিম সেলস ও ক্যাশ মেমো',
          path: '/gym/sales',
          category: 'Sales & POS',
          categoryBn: 'বিক্রি ও বিলিং',
          icon: ShoppingCart,
          iconName: 'ShoppingCart',
          keywords: ['gym pos', 'sale', 'billing', 'supplements', 'ক্যাশ মেমো', 'বিক্রি'],
          badge: 'POS',
          suggested: true,
        },
        {
          id: 'gym-members',
          title: 'Gym Members & Subscriptions',
          titleBn: 'সদস্যবৃন্দ ও মেম্বারশিপ',
          path: '/gym/members',
          category: 'Members',
          categoryBn: 'সদস্য',
          icon: Users,
          iconName: 'Users',
          keywords: ['members', 'subscriptions', 'renew', 'expire', 'সদস্য', 'মেম্বার'],
          suggested: true,
        },
        {
          id: 'gym-attendance',
          title: 'Member Attendance & Check-in',
          titleBn: 'উপস্থিতি ও চেক-ইন',
          path: '/gym/attendance',
          category: 'Members',
          categoryBn: 'সদস্য',
          icon: UserCheck,
          iconName: 'UserCheck',
          keywords: ['attendance', 'checkin', 'biometric', 'entry', 'উপস্থিতি'],
          suggested: true,
        },
        {
          id: 'gym-payments',
          title: 'Payments & Fee Collection',
          titleBn: 'পেমেন্ট ও বিলিং',
          path: '/gym/payments',
          category: 'Finance',
          categoryBn: 'হিসাব',
          icon: CreditCard,
          iconName: 'CreditCard',
          keywords: ['payment', 'fee', 'monthly', 'dues', 'পেমেন্ট', 'ফি'],
        },
        {
          id: 'gym-packages',
          title: 'Gym Packages & Plans',
          titleBn: 'প্যাকেজ ও মেম্বারশিপ প্ল্যান',
          path: '/gym/packages',
          category: 'Catalog',
          categoryBn: 'ক্যাটালগ',
          icon: Package,
          iconName: 'Package',
          keywords: ['packages', 'plans', 'pricing', 'প্যাকেজ'],
        },
        {
          id: 'gym-trainers',
          title: 'Trainers & Coaches',
          titleBn: 'ট্রেইনার ও কোচ',
          path: '/gym/trainers',
          category: 'Staff & HR',
          categoryBn: 'কর্মী',
          icon: Dumbbell,
          iconName: 'Dumbbell',
          keywords: ['trainers', 'coach', 'instructor', 'ট্রেইনার'],
        },
        {
          id: 'gym-products',
          title: 'Gym Products & Supplements',
          titleBn: 'প্রোডাক্টস ও সাপ্লিমেন্ট',
          path: '/gym/products',
          category: 'Catalog',
          categoryBn: 'ক্যাটালগ',
          icon: Package,
          iconName: 'Package',
          keywords: ['products', 'supplements', 'protein', 'shakes', 'প্রোডাক্ট'],
        },
        {
          id: 'gym-accounting',
          title: 'Gym Financial Reports',
          titleBn: 'আর্থিক রিপোর্ট ও হিসাব',
          path: '/gym/accounting',
          category: 'Finance',
          categoryBn: 'হিসাব',
          icon: FileBarChart,
          iconName: 'FileBarChart',
          keywords: ['reports', 'accounting', 'revenue', 'রিপোর্ট'],
        },
        {
          id: 'expenses',
          title: 'Gym Expenses',
          titleBn: 'খরচ (Expenses)',
          path: '/expenses',
          category: 'Finance',
          categoryBn: 'হিসাব',
          icon: DollarSign,
          iconName: 'DollarSign',
          keywords: ['expenses', 'electricity', 'rent', 'equipment', 'খরচ'],
        },
        {
          id: 'employees',
          title: 'Employees & Salaries',
          titleBn: 'কর্মচারী ও বেতন',
          path: '/employees',
          category: 'Staff & HR',
          categoryBn: 'কর্মী',
          icon: UserCheck,
          iconName: 'UserCheck',
          keywords: ['employees', 'staff', 'salary', 'payroll', 'কর্মচারী', 'বেতন'],
        },
        {
          id: 'gym-settings',
          title: 'Gym Settings',
          titleBn: 'জিম সেটিংস',
          path: '/gym/settings',
          category: 'Configuration',
          categoryBn: 'সেটিংস',
          icon: Sliders,
          iconName: 'Sliders',
          keywords: ['settings', 'gym setup', 'সেটিংস'],
        },
      ];
    }

    // Default: Retail, Grocery, Pharmacy, Fashion, Electronics, Wholesale & All Standard Business Types
    return [
      {
        id: 'dashboard',
        title: 'Business Dashboard',
        titleBn: 'ব্যবসা ড্যাশবোর্ড',
        path: '/dashboard',
        category: 'Overview',
        categoryBn: 'সারসংক্ষেপ',
        icon: LayoutDashboard,
        iconName: 'LayoutDashboard',
        keywords: ['dashboard', 'sales', 'analytics', 'overview', 'ড্যাশবোর্ড', 'বিক্রি'],
        suggested: true,
      },
      {
        id: 'new-sale',
        title: 'POS Billing & New Sale',
        titleBn: 'নতুন বিক্রি ও ক্যাশ মেমো (POS)',
        path: '/sales/new',
        category: 'Sales & POS',
        categoryBn: 'বিক্রি ও বিলিং',
        icon: ShoppingCart,
        iconName: 'ShoppingCart',
        keywords: ['sale', 'pos', 'sell', 'invoice', 'memo', 'billing', 'ক্যাশ মেমো', 'বিক্রি', 'নতুন বিক্রি'],
        badge: 'POS',
        suggested: true,
      },
      {
        id: 'sales-list',
        title: 'Sales & Invoices History',
        titleBn: 'বিক্রি ও চালানের হিসাব',
        path: '/sales',
        category: 'Sales & POS',
        categoryBn: 'বিক্রি ও বিলিং',
        icon: Receipt,
        iconName: 'Receipt',
        keywords: ['sales', 'invoices', 'receipts', 'due collections', 'বিক্রি তালিকা', 'মেমো'],
      },
      {
        id: 'products',
        title: 'Products & Inventory Catalog',
        titleBn: 'পণ্য তালিকা ও স্টক ক্যাটালগ',
        path: '/products',
        category: 'Inventory',
        categoryBn: 'পণ্য ও স্টক',
        icon: Package,
        iconName: 'Package',
        keywords: ['products', 'stock', 'barcode', 'items', 'catalog', 'পণ্য', 'স্টক', 'আইটেম'],
        suggested: true,
      },
      {
        id: 'purchases',
        title: 'Purchases & Stock Inward',
        titleBn: 'পণ্য ক্রয় ও স্টক ইনওয়ার্ড',
        path: '/purchases',
        category: 'Supply Chain',
        categoryBn: 'ক্রয় ও সরবরাহ',
        icon: Package,
        iconName: 'Package',
        keywords: ['purchases', 'buy', 'stock in', 'vendor bills', 'ক্রয়', 'মাল ক্রয়'],
      },
      {
        id: 'suppliers',
        title: 'Suppliers & Wholesalers',
        titleBn: 'সাপ্লায়ার ও মহাজন তালিকা',
        path: '/suppliers',
        category: 'Supply Chain',
        categoryBn: 'ক্রয় ও সরবরাহ',
        icon: Building2,
        iconName: 'Building2',
        keywords: ['suppliers', 'vendors', 'wholesalers', 'মহাজন', 'সাপ্লায়ার'],
      },
      {
        id: 'customers',
        title: 'Customers & Due Ledger',
        titleBn: 'কাস্টমার ও বাকি খাতা',
        path: '/customers',
        category: 'CRM',
        categoryBn: 'গ্রাহক',
        icon: Users,
        iconName: 'Users',
        keywords: ['customers', 'clients', 'due', 'ledger', 'baki', 'কাস্টমার', 'গ্রাহক', 'বাকি খাতা'],
        suggested: true,
      },
      {
        id: 'members',
        title: 'Memberships & Loyalty Rewards',
        titleBn: 'মেম্বারশিপ ও রিওয়ার্ড',
        path: '/members',
        category: 'CRM',
        categoryBn: 'গ্রাহক',
        icon: Crown,
        iconName: 'Crown',
        keywords: ['members', 'loyalty', 'points', 'discounts', 'মেম্বার', 'পয়েন্ট'],
      },
      {
        id: 'expenses',
        title: 'Store Expenses & Outflow',
        titleBn: 'দোকানের খরচ (Expenses)',
        path: '/expenses',
        category: 'Finance',
        categoryBn: 'হিসাব ও খরচ',
        icon: DollarSign,
        iconName: 'DollarSign',
        keywords: ['expenses', 'bills', 'rent', 'utilities', 'খরচ', 'দোকানের খরচ'],
      },
      {
        id: 'employees',
        title: 'Employees & Payroll',
        titleBn: 'কর্মচারী ও বেতন',
        path: '/employees',
        category: 'Staff & HR',
        categoryBn: 'কর্মী ও বেতন',
        icon: UserCheck,
        iconName: 'UserCheck',
        keywords: ['employees', 'staff', 'salary', 'payroll', 'attendance', 'কর্মচারী', 'বেতন'],
      },
      {
        id: 'financial-reports',
        title: 'Financial Reports & Profit/Loss',
        titleBn: 'আর্থিক রিপোর্ট ও লাভ-ক্ষতি',
        path: '/financial-reports',
        category: 'Finance & Analytics',
        categoryBn: 'হিসাব ও রিপোর্ট',
        icon: FileBarChart,
        iconName: 'FileBarChart',
        keywords: ['reports', 'accounting', 'profit loss', 'balance sheet', 'হিসাব', 'রিপোর্ট', 'লাভ ক্ষতি'],
      },
      {
        id: 'users',
        title: 'Users, Devices & Permissions',
        titleBn: 'ব্যবহারকারী, ডিভাইস ও অনুমতি',
        path: '/users',
        category: 'Security',
        categoryBn: 'নিরাপত্তা',
        icon: ShieldCheck,
        iconName: 'ShieldCheck',
        keywords: ['users', 'roles', 'permissions', 'pins', 'devices', 'ইউজার', 'অনুমতি'],
      },
      {
        id: 'store-settings',
        title: 'Store Profile & General Settings',
        titleBn: 'দোকানের সেটিংস ও বিবরণ',
        path: '/settings/store',
        category: 'Configuration',
        categoryBn: 'সেটিংস',
        icon: Store,
        iconName: 'Store',
        keywords: ['store settings', 'address', 'phone', 'logo', 'সেটিংস'],
      },
      {
        id: 'profile-settings',
        title: 'My Profile & Account',
        titleBn: 'প্রোফাইল সেটিংস',
        path: '/settings/profile',
        category: 'Configuration',
        categoryBn: 'সেটিংস',
        icon: User,
        iconName: 'User',
        keywords: ['profile', 'password', 'account', 'প্রোফাইল'],
      },
    ];
  }, [isRestaurant, isGym]);

  // Suggested Pages when query is empty
  const suggestedPages = useMemo(() => {
    return allSearchablePages.filter((p) => p.suggested).slice(0, 5);
  }, [allSearchablePages]);

  // Search Results filtering with Bengali & English query matching
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allSearchablePages.filter((page) => {
      const matchTitle = page.title.toLowerCase().includes(q);
      const matchTitleBn = (page.titleBn || '').toLowerCase().includes(q);
      const matchCategory = page.category.toLowerCase().includes(q);
      const matchCategoryBn = (page.categoryBn || '').toLowerCase().includes(q);
      const matchPath = page.path.toLowerCase().includes(q);
      const matchKeywords = (page.keywords || []).some((k) => k.toLowerCase().includes(q));

      return matchTitle || matchTitleBn || matchCategory || matchCategoryBn || matchPath || matchKeywords;
    });
  }, [query, allSearchablePages]);

  // Handle Selection & Navigation
  const handleSelect = (item) => {
    saveRecentSearch(item);
    setIsOpen(false);
    setQuery('');
    navigate(item.path);
  };

  // Keyboard Arrow Navigation
  const activeItemsCount = query.trim()
    ? searchResults.length
    : recentSearches.length > 0
    ? recentSearches.length + suggestedPages.length
    : suggestedPages.length;

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, activeItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + activeItemsCount) % Math.max(1, activeItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim() && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      } else if (!query.trim()) {
        const fullList = [...recentSearches, ...suggestedPages];
        if (fullList[selectedIndex]) {
          handleSelect(fullList[selectedIndex]);
        }
      }
    }
  };

  return (
    <div ref={searchContainerRef} className={`relative flex-1 w-full min-w-[260px] max-w-[420px] ${className || ''}`}>
      {/* Search Input Field */}
      <div className="relative flex items-center w-full">
        <Search className="w-4 h-4 text-slate-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            lang === 'bn'
              ? 'পণ্য, বিক্রি, কাস্টমার খুঁজুন...'
              : 'Search products, orders, customers...'
          }
          className="w-full h-9 pl-9 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200/80 dark:border-zinc-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#00df89] font-normal shadow-2xs transition-all"
        />

        {/* Clear input button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Dropdown Results Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full mt-2 z-[99999] rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-zinc-800/60 custom-scrollbar">
              
              {/* STATE 1: Live Filtered Search Results */}
              {query.trim() ? (
                <div>
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                        <span>{lang === 'bn' ? `ফলাফল (${searchResults.length})` : `Pages Found (${searchResults.length})`}</span>
                        <span className="text-[9px] font-normal lowercase">{currentBusinessType} mode</span>
                      </div>

                      {searchResults.map((item, idx) => {
                        const Icon = item.icon || LayoutDashboard;
                        const isSelected = selectedIndex === idx;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-850/60 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected
                                  ? 'bg-[#00df89] text-[#011812]'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:text-[#00df89]'
                              }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              
                              <div className="min-w-0">
                                <div className="font-semibold truncate flex items-center gap-1.5">
                                  <span>{lang === 'bn' ? item.titleBn : item.title}</span>
                                  {item.badge && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] text-[9px] font-bold">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1">
                                  <span>{lang === 'bn' ? item.categoryBn : item.category}</span>
                                  <span>•</span>
                                  <span className="font-mono">{item.path}</span>
                                </div>
                              </div>
                            </div>

                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                              isSelected ? 'translate-x-0.5 text-[#00df89]' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center px-4">
                      <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600 mb-2" />
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {lang === 'bn' ? `"${query}" এর জন্য কোনো পেজ পাওয়া যায়নি` : `No pages found for "${query}"`}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                        {lang === 'bn' ? 'বানান চেক করুন অথবা অন্যান্য কিওয়ার্ড ব্যবহার করুন।' : 'Try searching for POS, Menu, Sales, Customers, or Reports.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* STATE 2: Recent Searches & Smart Suggestions */
                <div className="space-y-3 pt-1">
                  
                  {/* Recent 5 Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {lang === 'bn' ? 'সাম্প্রতিক সার্চ (Recent)' : 'Recent Searches'}
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecent}
                          className="text-[10px] text-rose-500 hover:underline cursor-pointer lowercase"
                        >
                          {lang === 'bn' ? 'সব মুছুন' : 'Clear'}
                        </button>
                      </div>

                      {recentSearches.map((item, idx) => {
                        const isSelected = selectedIndex === idx;

                        return (
                          <div
                            key={`recent-${item.path || idx}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-slate-100 dark:bg-zinc-800/80 text-slate-900 dark:text-white'
                                : 'hover:bg-slate-50 dark:hover:bg-zinc-850/60 text-slate-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center shrink-0 group-hover:text-emerald-500">
                                <Clock className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold truncate">
                                  {lang === 'bn' ? item.titleBn || item.title : item.title}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                                  {item.path}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                title="Remove from recent"
                                onClick={(e) => removeRecentSearch(e, item.path)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Smart Suggested Pages for Current Business Type */}
                  <div className="space-y-1 pt-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#00df89]" />
                        {lang === 'bn' ? 'প্রস্তাবিত পেজ (Suggestions)' : 'Suggested Pages'}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] capitalize">
                        {currentBusinessType}
                      </span>
                    </div>

                    {suggestedPages.map((item, idx) => {
                      const Icon = item.icon || LayoutDashboard;
                      const globalIdx = recentSearches.length + idx;
                      const isSelected = selectedIndex === globalIdx;

                      return (
                        <button
                          key={`suggested-${item.id}`}
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
                              : 'hover:bg-slate-50 dark:hover:bg-zinc-850/60 text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#00df89] text-[#011812]'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:text-[#00df89]'
                            }`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <div className="min-w-0">
                              <div className="font-semibold truncate flex items-center gap-1.5">
                                <span>{lang === 'bn' ? item.titleBn : item.title}</span>
                                {item.badge && (
                                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00df89] text-[9px] font-bold">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                                {item.path}
                              </div>
                            </div>
                          </div>

                          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                            isSelected ? 'translate-x-0.5 text-[#00df89]' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                          }`} />
                        </button>
                      );
                    })}
                  </div>

                </div>
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-3 py-2 bg-slate-50/80 dark:bg-zinc-900/90 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded font-mono text-[9px]">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded font-mono text-[9px]">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded font-mono text-[9px]">esc</kbd> Close
                </span>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-[#00df89] flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Shopo QuickJump
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
