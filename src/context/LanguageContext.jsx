/**
 * @file LanguageContext.jsx
 * @description Context API provider for language state management (English & Bangla) with exact pricing rates (৳99, ৳199, ৳499).
 */
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export const dictionary = {
  en: {
    nav: {
      logo: "Shopo",
      features: "Features",
      solutions: "Solutions",
      howItWorks: "How It Works",
      pricing: "Pricing",
      about: "About",
      login: "Login",
      getStarted: "Get Started"
    },
    hero: {
      badge: "No. 1 Shop Operating System in Bangladesh",
      title: "Run Your Shop Smarter With Shopo",
      subtitle: "Manage inventory, sales, customers, employees, and business analytics from one simple platform.",
      primaryCta: "Start Free Trial",
      secondaryCta: "Watch 2-Min Demo",
      mockup: {
        searchPlaceholder: "Search products, orders, customers..."
      },
      stats: {
        totalRevenue: "Total Revenue",
        todaySales: "Today Sales",
        activeCustomers: "Active Customers",
        lowStock: "Low Stock Alert"
      }
    },
    features: {
      badge: "Powerful Features",
      title: "Everything You Need to Run & Scale Your Business",
      subtitle: "Built specifically for retail stores, restaurants, pharmacies, and wholesale businesses in Bangladesh.",
      items: [
        { id: 'f1', title: 'Inventory & Stock Management', desc: 'Barcode scanning, low stock alerts, product variant tracking, and automated reorder reminders.' },
        { id: 'f2', title: 'Sales & POS Billing', desc: 'Fast cashier memo generation, discount management, bKash/Nagad/Card payments, and thermal print support.' },
        { id: 'f3', title: 'Customer Credit & Khata', desc: 'Digital Bakeya Khata log, automatic SMS due reminders, and customer loyalty credit histories.' },
        { id: 'f4', title: 'Employee & Staff Management', desc: 'Role permissions, shift attendance, commission calculations, and monthly salary disbursement.' },
        { id: 'f5', title: 'Accounting & Profit Reports', desc: 'Automated profit/loss calculations, expense tracking, daily cashbook summaries, and VAT reports.' },
        { id: 'f6', title: 'AI Business Intelligence', desc: 'Smart sales forecasting, best-selling product insights, and personalized restock advice.' }
      ]
    },
    solutions: {
      badge: "Tailored Solutions",
      title: "Designed For Every Business Type",
      subtitle: "Customize your workspace dashboard with features specific to your industry.",
      sectors: [
        { title: 'Grocery & Superstores', desc: 'Perishable expiry alerts, weight scale integration, and barcode inventory.' },
        { title: 'Clothing & Fashion', desc: 'Size & color variants (S/M/L/XL), price tags, and seasonal catalog discounts.' },
        { title: 'Restaurants & Cafes', desc: 'Kitchen Display System (KDS), table management, and order receipts.' },
        { title: 'Electronics & Gadgets', desc: 'IMEI & serial number tracking, warranty card generation, and repair logs.' },
        { title: 'Gym & Fitness Centers', desc: 'Member subscriptions, RFID check-ins, and recurring payment logs.' },
        { title: 'Stationery & Bookshops', desc: 'ISBN book lookup, photocopy billing, and student credit tabs.' }
      ]
    },
    howItWorks: {
      badge: "Simple Setup",
      title: "Get Started in 3 Easy Steps",
      subtitle: "No complex software installation required. Access from any phone or computer.",
      steps: [
        { step: '01', title: 'Create Shop Profile', desc: 'Select your business type and customize your store name in 30 seconds.' },
        { step: '02', title: 'Add Products & Stock', desc: 'Upload your products using barcode scanning or simple Excel import.' },
        { step: '03', title: 'Start Selling & Tracking', desc: 'Issue digital cash memos, accept bKash/Card payments, and track live profits.' }
      ]
    },
    pricing: {
      badge: "Flexible Pricing",
      title: "Simple, Transparent Pricing For Any Store Size",
      subtitle: "Start free for 14 days. No credit card required.",
      popularBadge: "Most Popular",
      monthly: "Monthly",
      yearly: "Yearly (Save 20%)",
      plans: [
        {
          id: 'starter',
          name: 'Starter',
          price: '৳ 99',
          period: '/month',
          desc: 'Perfect for small single-counter retail shops.',
          features: ['1 Shop Location', 'Up to 1,000 Products', 'Single User Access', 'POS & Sales Memos', 'Standard Support'],
          cta: 'Start Free Trial',
          popular: false
        },
        {
          id: 'business',
          name: 'Business',
          price: '৳ 199',
          period: '/month',
          desc: 'Best for growing businesses with staff and multi-warehouses.',
          features: ['3 Shop Outlets', 'Unlimited Products', '5 Staff User Logins', 'Bakeya Khata & SMS Alerts', 'Priority 24/7 Support'],
          cta: 'Get Started Now',
          popular: true
        },
        {
          id: 'premium',
          name: 'Premium',
          price: '৳ 499',
          period: '/month',
          desc: 'For chains, wholesalers, and multi-branch operations.',
          features: ['Unlimited Locations', 'Unlimited Outlets & SKUs', 'Custom Role Permissions', 'Dedicated Account Manager', 'Custom API Integrations'],
          cta: 'Contact Sales',
          popular: false
        }
      ]
    },
    matrix: {
      title: "Compare Plan Features",
      subtitle: "Everything included in each plan.",
      featureCol: "Feature Comparison",
      features: [
        { name: "POS & Cash Memo Billing", starter: true, business: true, premium: true },
        { name: "Inventory Products Count", starter: "1,000 SKUs", business: "Unlimited", premium: "Unlimited" },
        { name: "Customer Bakeya Khata & SMS", starter: false, business: true, premium: true },
        { name: "Multi-Store Outlets", starter: "1 Outlet", business: "3 Outlets", premium: "Unlimited" },
        { name: "Staff User Logins", starter: "1 User", business: "5 Users", premium: "Unlimited" },
        { name: "Profit & Loss Reports", starter: true, business: true, premium: true },
        { name: "Custom Role Permissions", starter: false, business: false, premium: true }
      ]
    },
    cta: {
      title: "Ready to Supercharge Your Shop Operations?",
      subtitle: "Join over 10,000+ businesses across Bangladesh using Shopo to boost profits.",
      button: "Get Started For Free"
    },
    footer: {
      rights: "© 2026 Shopo Technologies Inc. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service"
    },
    dashboard: {
      title: "Dashboard",
      switchLanguage: "Language",
      totalRevenue: "Total Revenue",
      totalSales: "Total Sales",
      activeCustomers: "Active Customers",
      totalOrders: "Total Orders",
      vsLastMonth: "vs last month",
      fromLastMonth: "from last month",
      salesPerformance: "Sales Performance",
      salesOverviewSub: "Daily sales overview for this month",
      thisMonth: "This Month",
      dailySales: "Daily Sales",
      quickActions: "Quick Actions",
      quickActionsSub: "Common tasks and shortcuts",
      newSale: "New Sale",
      newPurchase: "New Purchase",
      newInvoice: "New Invoice",
      addProduct: "Add Product",
      viewAllActions: "View All Actions",
      recentTransactions: "Recent Transactions",
      recentTransSub: "Latest sales and purchases",
      viewAll: "View All",
      lowStockAlerts: "Low Stock Alerts",
      lowStockSub: "Items need restocking",
      restock: "Restock",
      paid: "Paid",
      pending: "Pending",
      items: "Items",
      minStock: "min",
      sidebar: {
        platform: "Platform",
        dashboard: "Dashboard",
        sales: "Sales",
        products: "Products",
        inventory: "Inventory",
        pos: "POS & Retail",
        accounting: "Accounting & Finance",
        settings: "Settings"
      }
    }
  },

  bn: {
    nav: {
      logo: "Shopo",
      features: "ফিচারসমূহ",
      solutions: "সমাধান",
      howItWorks: "কীভাবে কাজ করে",
      pricing: "মূল্য তালিকা",
      about: "আমাদের সম্পর্কে",
      login: "লগইন",
      getStarted: "শুরু করুন"
    },
    hero: {
      badge: "বাংলাদেশের ১ নম্বর শপ অপারেটিং সিস্টেম",
      title: "Shopo-র সাথে আপনার ব্যবসা পরিচালনা করুন সহজ উপায়ে",
      subtitle: "ইনভেন্টরি, সেলস মেমো, কাস্টমার বাকি খাতা ও কর্মচারীদের হিসাব একই প্ল্যাটফর্ম থেকে রাখুন।",
      primaryCta: "ফ্রি ট্রায়াল শুরু করুন",
      secondaryCta: "২ মিনিটের ডেমো দেখুন",
      mockup: {
        searchPlaceholder: "পণ্য, বিক্রি বা কাস্টমার খুঁজুন..."
      },
      stats: {
        totalRevenue: "মোট আয়",
        todaySales: "আজকের বিক্রি",
        activeCustomers: "সক্রিয় গ্রাহক",
        lowStock: "স্বল্প স্টকের অ্যালার্ট"
      }
    },
    features: {
      badge: "সেরা ফিচারসমূহ",
      title: "ব্যবসা পরিচালনায় যা কিছু আপনার প্রয়োজন",
      subtitle: "বাংলাদেশের খুচরা দোকান, রেস্তোরাঁ, ফার্মেসি ও পাইকারি ব্যবসার উপযোগী।",
      items: [
        { id: 'f1', title: 'স্টক ও ইনভেন্টরি ম্যানেজমেন্ট', desc: 'বারকোড স্ক্যানিং, কম স্টকের অ্যালার্ট, ভ্যারিয়েন্ট ট্র্যাকিং ও স্টক রিমাইন্ডার।' },
        { id: 'f2', title: 'বিক্রি ও পিওএস বিলিং', desc: 'দ্রুত ক্যাশ মেমো প্রিন্ট, ডিসকাউন্ট ছাড়, বিকাশ/নগদ/কার্ড পেমেন্ট গ্রহণ।' },
        { id: 'f3', title: 'কাস্টমার বাকি খাতা (Digital Khata)', desc: 'ডিজিটাল বাকি খাতা, অটোমেটিক এসএমএস রিমাইন্ডার ও কাস্টমার ক্রেডিট ইতিহাস।' },
        { id: 'f4', title: 'কর্মচারীদের বেতন ও পারমিশন', desc: 'স্টাফ এক্সেস পারমিশন, শিফট অ্যাটেনডেন্স, কমিশন ও মাসিক বেতন হিসাব।' },
        { id: 'f5', title: 'হিসাব ও লাভ-লোকসান রিপোর্ট', desc: 'অটোমেটিক লাভ-লোকসান হিসাব, ক্যাশবুক লেজার ও দৈনিক আয়-ব্যয়ের সামারি।' },
        { id: 'f6', title: 'এআই স্মার্ট বিজনেস অ্যানালিটিক্স', desc: 'স্মার্ট বিক্রয় পূর্বাভাস, সেরা বিক্রীত পণ্যের তথ্য ও ইনভেন্টরি টিপস।' }
      ]
    },
    solutions: {
      badge: "ব্যবসার সমাধান",
      title: "আপনার ইন্ডাস্ট্রি অনুযায়ী বিশেষায়িত সমাধান",
      subtitle: "আপনার দোকান বা ব্যবসার ধরন অনুযায়ী বেছে নিন উপযুক্ত ফিচার ও ড্যাশবোর্ড layout।",
      sectors: [
        { title: 'মুদি দোকান ও সুপারশপ', desc: 'মেয়াদের অ্যালার্ট, ডিজিটাল স্কেল ওজন ও ফাস্ট মেমো প্রিন্ট।' },
        { title: 'পোশাক ও ফ্যাশন শপ', desc: 'সাইজ ও কালার ম্যাট্রিক্স (S/M/L/XL), প্রাইজ ট্যাগ ও ঈদের অফার ছাড়।' },
        { title: 'রেস্তোরাঁ ও ক্যাফে', desc: 'কচিন ডিসপ্লে সিস্টেম (KDS), টেবিল ম্যানেজমেন্ট ও অর্ডার রসিদ।' },
        { title: 'ইলেকট্রনিক্স ও গ্যাজেট', desc: 'IMEI ও সিরিয়াল নম্বর ট্র্যাকিং, ওয়ারেন্টি কার্ড ও সার্ভিস লগ।' },
        { title: 'জিম ও ফিটনেস সেন্টার', desc: 'মেম্বারশিপ প্যাকেজ, কার্ড এন্ট্রি ও মাসিক সাবস্ক্রিপশন ফি।' },
        { title: 'স্টেশনরি ও বইয়ের দোকান', desc: 'আইএসবিএন বই সার্চ, ফটোকপি বিল ও স্টুডেন্ট বাকি খাতা।' }
      ]
    },
    howItWorks: {
      badge: "সহজ ধাপসমূহ",
      title: "৩টি সহজ ধাপে শুরু করুন",
      subtitle: "কোনো জটিল সফটওয়্যার ইনস্টলেশনের প্রয়োজন নেই। মোবাইল ও কম্পিউটার থেকে ব্যবহারযোগ্য।",
      steps: [
        { step: '০১', title: 'শপ প্রোফাইল খুলুন', desc: 'আপনার ব্যবসায়ের ধরন নির্বাচন করুন এবং ৩০ সেকেন্ডে অ্যাকাউন্ট চালু করুন।' },
        { step: '০২', title: 'পণ্য যুক্ত করুন', desc: 'বারকোড স্ক্যান বা এক্সেল ফাইলের মাধ্যমে আপনার পণ্যগুলো এন্ট্রি দিন।' },
        { step: '০৩', title: 'বিক্রি ও মেমো চালু করুন', desc: 'ডিজিটাল মেমো প্রদান করুন, বিকাশ/নগদে পেমেন্ট গ্রহণ করুন ও লাভ দেখুন।' }
      ]
    },
    pricing: {
      badge: "মূল্য তালিকা",
      title: "সহজ ও সাশ্রয়ী প্যাকেজ যেকোনো আকারের ব্যবসার জন্য",
      subtitle: "১৪ দিনের ফ্রি ট্রায়াল শুরু করুন। কোনো ক্রেডিট কার্ডের প্রয়োজন নেই।",
      popularBadge: "জনপ্রিয় প্যাকেজ",
      monthly: "মাসিক",
      yearly: "বার্ষিক (২০% ছাড়)",
      plans: [
        {
          id: 'starter',
          name: 'স্টার্টার',
          price: '৳ ৯৯',
          period: '/মাস',
          desc: 'ছোট বা একক কাউন্টার খুচরা দোকানের জন্য উপযোগী।',
          features: ['১টি দোকান আউটলেট', 'সর্বোচ্চ ১,০০০টি পণ্য', '১ জন ইউজার এক্সেস', 'পিওএস ও বিক্রয় মেমো', 'স্ট্যান্ডার্ড সাপোর্ট'],
          cta: 'ফ্রি ট্রায়াল শুরু করুন',
          popular: false
        },
        {
          id: 'business',
          name: 'বিজনেস',
          price: '৳ ১৯৯',
          period: '/মাস',
          desc: 'ক্রমবর্ধমান দোকান, একাধিক স্টাফ ও বাকি খাতা ব্যবহারকারীদের জন্য।',
          features: ['৩টি দোকান শাখা', 'আনলিমিটেড পণ্য তালিকা', '৫ জন স্টাফ লগইন', 'বাকি খাতা ও এসএমএস অ্যালার্ট', '২৪/৭ অগ্রাধিকার সাপোর্ট'],
          cta: 'এখনি শুরু করুন',
          popular: true
        },
        {
          id: 'premium',
          name: 'প্রিমিয়াম',
          price: '৳ ৪৯৯',
          period: '/মাস',
          desc: 'পাইকারি ব্যবসায়ী, চেইন শপ ও মাল্টি-ব্রাঞ্চ আউটলেটের জন্য।',
          features: ['আনলিমিটেড শাখা', 'আনলিমিটেড আইটেম ও SKU', 'কাস্টম স্টাফ পারমিশন', 'ডেডিকেটেড একাউন্ট ম্যানেজার', 'কাস্টম এপিআই সংযোগ'],
          cta: 'যোগাযোগ করুন',
          popular: false
        }
      ]
    },
    matrix: {
      title: "প্যাকেজের তুলনা",
      subtitle: "প্রতিটি প্যাকেজে কী কী ফিচার অন্তর্ভুক্ত রয়েছে।",
      featureCol: "ফিচার সমূহের তালিকা",
      features: [
        { name: "পিওএস ও ক্যাশ মেমো বিলিং", starter: true, business: true, premium: true },
        { name: "ইনভেন্টরি প্রোডাক্ট সংখ্যা", starter: "১,০০০টি SKU", business: "আনলিমিটেড", premium: "আনলিমিটেড" },
        { name: "কাস্টমার বাকি খাতা ও এসএমএস", starter: false, business: true, premium: true },
        { name: "মাল্টি-শপ আউটলেট শাখা", starter: "১টি শাখা", business: "৩টি শাখা", premium: "আনলিমিটেড" },
        { name: "স্টাফ ইউজার লগইন", starter: "১ জন", business: "৫ জন", premium: "আনলিমিটেড" },
        { name: "লাভ-লোকসান ও ফাইন্যান্স রিপোর্ট", starter: true, business: true, premium: true },
        { name: "কাস্টম স্টাফ এক্সেস পারমিশন", starter: false, business: false, premium: true }
      ]
    },
    cta: {
      title: "আপনার দোকান পরিচালনা সহজ করতে প্রস্তুত?",
      subtitle: "বাংলাদেশের ১০,০০০+ ব্যবসা প্রতিষ্ঠানের সাথে যুক্ত হয়ে আপনার আয় বাড়ান।",
      button: "ফ্রি অ্যাকাউন্ট খুলুন"
    },
    footer: {
      rights: "© ২০২৬ Shopo টেকনোলজিস। সর্বস্বত্ব সংরক্ষিত।",
      privacy: "প্রাইভেসি পলিসি",
      terms: "টার্মস অফ সার্ভিস"
    },
    dashboard: {
      title: "ড্যাশবোর্ড",
      switchLanguage: "ভাষা",
      totalRevenue: "মোট আয়",
      totalSales: "মোট বিক্রি",
      activeCustomers: "সক্রিয় গ্রাহক",
      totalOrders: "মোট অর্ডার",
      vsLastMonth: "গত মাসের তুলনায়",
      fromLastMonth: "গত মাস থেকে",
      salesPerformance: "বিক্রয় পারফরম্যান্স",
      salesOverviewSub: "চলতি মাসের দৈনিক বিক্রয়ের বিবরণ",
      thisMonth: "এই মাস",
      dailySales: "দৈনিক বিক্রি",
      quickActions: "দ্রুত অ্যাকশন",
      quickActionsSub: "প্রয়োজনীয় ফিচার ও শর্টকাট",
      newSale: "নতুন বিক্রি",
      newPurchase: "নতুন ক্রয়",
      newInvoice: "নতুন ইনভয়েস",
      addProduct: "পণ্য যুক্ত করুন",
      viewAllActions: "সব অ্যাকশন দেখুন",
      recentTransactions: "সাম্প্রতিক লেনদেন",
      recentTransSub: "সর্বশেষ বিক্রি ও ক্রয়ের তালিকা",
      viewAll: "সব দেখুন",
      lowStockAlerts: "স্বল্প স্টকের অ্যালার্ট",
      lowStockSub: "যে পণ্যগুলো স্টক করা প্রয়োজন",
      restock: "স্টক করুন",
      paid: "পরিশোধিত",
      pending: "বকেয়া",
      items: "আইটেম",
      minStock: "সর্বনিম্ন",
      sidebar: {
        platform: "প্ল্যাটফর্ম",
        dashboard: "ড্যাশবোর্ড",
        sales: "বিক্রি (সেলস)",
        products: "প্রোডাক্টস (পণ্য)",
        inventory: "স্টক (ইনভেন্টরি)",
        pos: "কাউন্টার ও পিওএস",
        accounting: "হিসাব ও অর্থায়ন",
        settings: "সেটিংস"
      }
    }
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const t = dictionary[lang] || dictionary.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
