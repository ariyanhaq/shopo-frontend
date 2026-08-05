/**
 * @file Landing.jsx
 * @description Premium SaaS Landing Page for Shopo featuring smooth Framer Motion spring physics animations across all devices.
 */
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import HeroDashboardMockup from './HeroDashboardMockup';
import {
  Store, Sparkles, ArrowRight, Play, CheckCircle2, ShieldCheck,
  TrendingUp, Package, Users, UserCheck, BarChart3, Bot,
  ShoppingBag, Shirt, Utensils, Smartphone, Dumbbell, BookOpen,
  Search, Bell, AlertTriangle, ChevronRight, Zap, SmartphoneNfc, Lock, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const { lang } = useLanguage();
  const isBn = lang === 'bn';

  const smoothFadeUp = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const smoothScaleUp = {
    hidden: { opacity: 0, scale: 0.96, y: 25 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08
      }
    }
  };

  // Feature cards data
  const featuresList = [
    {
      id: 'f1',
      icon: <Package className="w-6 h-6 text-emerald-600" />,
      title: isBn ? 'স্টক ও ইনভেন্টরি ম্যানেজমেন্ট' : 'Inventory & Stock Management',
      desc: isBn ? 'বারকোড স্ক্যানিং, কম স্টকের অ্যালার্ট, ভ্যারিয়েন্ট ট্র্যাকিং ও স্টক রিমাইন্ডার।' : 'Barcode scanning, low stock alerts, product variant tracking, and automated reorder reminders.'
    },
    {
      id: 'f2',
      icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
      title: isBn ? 'বিক্রি ও পিওএস বিলিং' : 'Sales & POS Billing',
      desc: isBn ? 'দ্রুত ক্যাশ মেমো প্রিন্ট, ডিসকাউন্ট ছাড়, বিকাশ/নগদ/কার্ড পেমেন্ট গ্রহণ।' : 'Fast cashier memo generation, discount management, bKash/Nagad/Card payments, and thermal print support.'
    },
    {
      id: 'f3',
      icon: <Users className="w-6 h-6 text-indigo-600" />,
      title: isBn ? 'কাস্টমার বাকি খাতা (Digital Khata)' : 'Customer Credit & Khata',
      desc: isBn ? 'ডিজিটাল বাকি খাতা, অটোমেটিক এসএমএস রিমাইন্ডার ও কাস্টমার ক্রেডিট ইতিহাস।' : 'Digital Bakeya Khata log, automatic SMS due reminders, and customer loyalty credit histories.'
    },
    {
      id: 'f4',
      icon: <UserCheck className="w-6 h-6 text-purple-600" />,
      title: isBn ? 'কর্মচারীদের বেতন ও পারমিশন' : 'Employee & Staff Management',
      desc: isBn ? 'স্টাফ এক্সেস পারমিশন, শিফট অ্যাটেনডেন্স, কমিশন ও মাসিক বেতন হিসাব।' : 'Role permissions, shift attendance, commission calculations, and monthly salary disbursement.'
    },
    {
      id: 'f5',
      icon: <BarChart3 className="w-6 h-6 text-amber-600" />,
      title: isBn ? 'হিসাব ও লাভ-লোকসান রিপোর্ট' : 'Accounting & Profit Reports',
      desc: isBn ? 'অটোমেটিক লাভ-লোকসান হিসাব, ক্যাশবুক লেজার ও দৈনিক আয়-ব্যয়ের সামারি।' : 'Automated profit/loss calculations, expense tracking, daily cashbook summaries, and VAT reports.'
    },
    {
      id: 'f6',
      icon: <Bot className="w-6 h-6 text-[#00df89]" />,
      title: isBn ? 'এআই স্মার্ট বিজনেস অ্যানালিটিক্স' : 'AI Business Intelligence',
      desc: isBn ? 'স্মার্ট বিক্রয় পূর্বাভাস, সেরা বিক্রীত পণ্যের তথ্য ও ইনভেন্টরি টিপস।' : 'Smart sales forecasting, best-selling product insights, and personalized restock advice.'
    }
  ];

  // Industry solutions data
  const solutionsList = [
    {
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
      title: isBn ? 'মুদি দোকান ও সুপারশপ' : 'Grocery & Superstores',
      desc: isBn ? 'মেয়াদের অ্যালার্ট, ডিজিটাল স্কেল ওজন ও ফাস্ট মেমো প্রিন্ট।' : 'Perishable expiry alerts, weight scale integration, and barcode inventory.'
    },
    {
      icon: <Shirt className="w-6 h-6 text-blue-600" />,
      title: isBn ? 'পোশাক ও ফ্যাশন শপ' : 'Clothing & Fashion',
      desc: isBn ? 'সাইজ ও কালার ম্যাট্রিক্স (S/M/L/XL), প্রাইজ ট্যাগ ও অফার ছাড়।' : 'Size & color variants (S/M/L/XL), price tags, and seasonal catalog discounts.'
    },
    {
      icon: <Utensils className="w-6 h-6 text-amber-600" />,
      title: isBn ? 'রেস্তোরাঁ ও ক্যাফে' : 'Restaurants & Cafes',
      desc: isBn ? 'কচিন ডিসপ্লে সিস্টেম (KDS), টেবিল ম্যানেজমেন্ট ও অর্ডার রসিদ।' : 'Kitchen Display System (KDS), table management, and order receipts.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-600" />,
      title: isBn ? 'ইলেকট্রনিক্স ও গ্যাজেট' : 'Electronics & Gadgets',
      desc: isBn ? 'IMEI ও সিরিয়াল নম্বর ট্র্যাকিং, ওয়ারেন্টি কার্ড ও সার্ভিস লগ।' : 'IMEI & serial number tracking, warranty card generation, and repair logs.'
    },
    {
      icon: <Dumbbell className="w-6 h-6 text-rose-600" />,
      title: isBn ? 'জিম ও ফিটনেস সেন্টার' : 'Gym & Fitness Centers',
      desc: isBn ? 'মেম্বারশিপ প্যাকেজ, কার্ড এন্ট্রি ও মাসিক সাবস্ক্রিপশন ফি।' : 'Member subscriptions, RFID check-ins, and recurring payment logs.'
    },
    {
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      title: isBn ? 'স্টেশনরি ও বইয়ের দোকান' : 'Stationery & Bookshops',
      desc: isBn ? 'আইএসবিএন বই সার্চ, ফটোকপি বিল ও স্টুডেন্ট বাকি খাতা।' : 'ISBN book lookup, photocopy billing, and student credit tabs.'
    }
  ];

  // How it works steps
  const howItWorksSteps = [
    {
      step: '01',
      title: isBn ? 'শপ প্রোফাইল খুলুন' : 'Create Shop Profile',
      desc: isBn ? 'আপনার ব্যবসায়ের ধরন নির্বাচন করুন এবং ৩০ সেকেন্ডে অ্যাকাউন্ট চালু করুন।' : 'Select your business type and customize your store name in 30 seconds.'
    },
    {
      step: '02',
      title: isBn ? 'পণ্য যুক্ত করুন' : 'Add Products & Stock',
      desc: isBn ? 'বারকোড স্ক্যানার দিয়ে স্ক্যান করুন বা ফ্রি এক্সেল ফাইলের মাধ্যমে ফাইল আপলোড দিন।' : 'Upload your products using barcode scanning or simple Excel import.'
    },
    {
      step: '03',
      title: isBn ? 'বিক্রি ও মেমো চালু করুন' : 'Start Selling & Tracking',
      desc: isBn ? 'ডিজিটাল মেমো প্রদান করুন, বিকাশ/নগদে পেমেন্ট গ্রহণ করুন ও লাভ দেখুন।' : 'Issue digital cash memos, accept bKash/Card payments, and track live profits.'
    }
  ];

  // Pricing plans
  const pricingPlans = [
    {
      id: 'starter',
      name: isBn ? 'স্টার্টার' : 'Starter',
      price: isBn ? '৳ ৯৯' : '৳ 99',
      period: isBn ? '/মাস' : '/month',
      desc: isBn ? 'ছোট বা একক কাউন্টার খুচরা দোকানের জন্য উপযোগী।' : 'Perfect for small single-counter retail shops.',
      features: isBn ? [
        '১টি দোকান আউটলেট',
        'সর্বোচ্চ ১,০০০টি পণ্য',
        '১ জন ইউজার এক্সেস',
        'পিওএস ও বিক্রয় মেমো',
        'স্ট্যান্ডার্ড সাপোর্ট'
      ] : [
        '1 Shop Location',
        'Up to 1,000 Products',
        'Single User Access',
        'POS & Sales Memos',
        'Standard Support'
      ],
      cta: isBn ? 'ফ্রি ট্রায়াল শুরু করুন' : 'Start Free Trial',
      popular: false
    },
    {
      id: 'business',
      name: isBn ? 'বিজনেস' : 'Business',
      price: isBn ? '৳ ১৯৯' : '৳ 199',
      period: isBn ? '/মাস' : '/month',
      desc: isBn ? 'ক্রমবর্ধমান দোকান, একাধিক স্টাফ ও বাকি খাতা ব্যবহারকারীদের জন্য।' : 'Best for growing businesses with staff and multi-warehouses.',
      features: isBn ? [
        '৩টি দোকান শাখা',
        'আনলিমিটেড পণ্য তালিকা',
        '৫ জন স্টাফ লগইন',
        'বাকি খাতা ও এসএমএস অ্যালার্ট',
        '২৪/৭ অগ্রাধিকার সাপোর্ট'
      ] : [
        '3 Shop Outlets',
        'Unlimited Products',
        '5 Staff User Logins',
        'Bakeya Khata & SMS Alerts',
        'Priority 24/7 Support'
      ],
      cta: isBn ? 'এখনি শুরু করুন' : 'Get Started Now',
      popular: true
    },
    {
      id: 'premium',
      name: isBn ? 'প্রিমিয়াম' : 'Premium',
      price: isBn ? '৳ ৪৯৯' : '৳ 499',
      period: isBn ? '/মাস' : '/month',
      desc: isBn ? 'পাইকারি ব্যবসায়ী, চেইন শপ ও মাল্টি-ব্রাঞ্চ আউটলেটের জন্য।' : 'For chains, wholesalers, and multi-branch operations.',
      features: isBn ? [
        'আনলিমিটেড শাখা',
        'আনলিমিটেড আইটেম ও SKU',
        'কাস্টম স্টাফ পারমিশন',
        'ডেডিকেটেড একাউন্ট ম্যানেজার',
        'কাস্টম এপিআই সংযোগ'
      ] : [
        'Unlimited Locations',
        'Unlimited Outlets & SKUs',
        'Custom Role Permissions',
        'Dedicated Account Manager',
        'Custom API Integrations'
      ],
      cta: isBn ? 'যোগাযোগ করুন' : 'Contact Sales',
      popular: false
    }
  ];

  // Feature comparison matrix
  const matrixFeatures = [
    { name: isBn ? 'পিওএস ও ক্যাশ মেমো বিলিং' : 'POS & Cash Memo Billing', starter: true, business: true, premium: true },
    { name: isBn ? 'ইনভেন্টরি প্রোডাক্ট সংখ্যা' : 'Inventory Products Count', starter: '1,000 SKUs', business: 'Unlimited', premium: 'Unlimited' },
    { name: isBn ? 'কাস্টমার বাকি খাতা ও এসএমএস' : 'Customer Bakeya Khata & SMS', starter: false, business: true, premium: true },
    { name: isBn ? 'মাল্টি-শপ আউটলেট শাখা' : 'Multi-Store Outlets', starter: '1 Outlet', business: '3 Outlets', premium: 'Unlimited' },
    { name: isBn ? 'স্টাফ ইউজার লগইন' : 'Staff User Logins', starter: '1 User', business: '5 Users', premium: 'Unlimited' },
    { name: isBn ? 'লাভ-লোকসান ও ফাইন্যান্স রিপোর্ট' : 'Profit & Loss Reports', starter: true, business: true, premium: true },
    { name: isBn ? 'কাস্টম স্টাফ এক্সেস পারমিশন' : 'Custom Role Permissions', starter: false, business: false, premium: true }
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-slate-800 font-sans selection:bg-[#00df89] selection:text-[#011812] overflow-x-hidden w-full max-w-full">
      
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 space-y-24 sm:space-y-32 pb-24">

        {/* ---------------------------------------------------- */}
        {/* HERO SECTION                                         */}
        {/* ---------------------------------------------------- */}
        <section className="min-h-[85vh] sm:min-h-0 py-12 sm:pt-16 sm:pb-0 flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto my-auto">
            
            {/* Pill Badge */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={smoothFadeUp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{isBn ? 'বাংলাদেশের ১ নম্বর শপ অপারেটিং সিস্টেম' : 'No. 1 Shop Operating System in Bangladesh'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={smoothFadeUp}
              className={`font-extrabold tracking-tight text-slate-900 ${
                isBn
                  ? 'text-3xl sm:text-4xl lg:text-5xl leading-[1.25]'
                  : 'text-4xl sm:text-6xl lg:text-7xl leading-[1.15]'
              }`}
            >
              {!isBn ? (
                <>
                  Run Your Shop Smarter With <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">Shopo</span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">Shopo</span> দিয়ে আপনার ব্যবসা পরিচালনা করুন আরও সহজে
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial="hidden"
              animate="visible"
              variants={smoothFadeUp}
              className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed px-2 sm:px-0"
            >
              {isBn
                ? 'ইনভেন্টরি, সেলস মেমো, কাস্টমার বাকি খাতা ও কর্মচারীদের হিসাব একই প্ল্যাটফর্ম থেকে রাখুন।'
                : 'Manage inventory, sales, customers, employees, and business analytics from one simple platform.'}
            </motion.p>

            {/* Hero Actions */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={smoothFadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4"
            >
              <motion.div
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full sm:w-auto"
              >
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{isBn ? 'ফ্রি ট্রায়াল শুরু করুন' : 'Start Free Trial'}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full sm:w-auto"
              >
                <a
                  href="#demo"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  <span>{isBn ? '২ মিনিটের ডেমো দেখুন' : 'Watch Demo'}</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Trust highlights */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={smoothFadeUp}
              className="pt-6 sm:pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-500 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? '১৪ দিনের ফ্রি ট্রায়াল' : 'Free 14-Day Trial'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'কোনো ক্রেডিট কার্ড লাগবে না' : 'No Credit Card Required'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'ইনস্ট্যান্ট অ্যাকাউন্ট চালু' : 'Instant Setup'}</span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Responsive SaaS Dashboard Preview Mockup */}
          <motion.div
            id="demo"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={smoothScaleUp}
            className="mt-12 sm:mt-16 relative mx-auto max-w-6xl w-full overflow-hidden"
          >
            <HeroDashboardMockup />
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* FEATURES SECTION                                     */}
        {/* ---------------------------------------------------- */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide uppercase">
              {isBn ? 'সেরা ফিচারসমূহ' : 'Powerful Features'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isBn ? 'ব্যবসা পরিচালনায় যা কিছু আপনার প্রয়োজন' : 'Everything You Need to Run & Scale Your Business'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {isBn ? 'বাংলাদেশের খুচরা দোকান, রেস্তোরাঁ, ফার্মেসি ও পাইকারি ব্যবসার উপযোগী।' : 'Built specifically for retail stores, restaurants, pharmacies, and wholesale businesses in Bangladesh.'}
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {featuresList.map((feat) => (
              <motion.div
                key={feat.id}
                variants={smoothFadeUp}
                whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-50 transition-all">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* BUSINESS SOLUTIONS SECTION                           */}
        {/* ---------------------------------------------------- */}
        <section id="solutions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold tracking-wide uppercase">
              {isBn ? 'ব্যবসার সমাধান' : 'Tailored Solutions'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isBn ? 'আপনার ইন্ডাস্ট্রি অনুযায়ী বিশেষায়িত সমাধান' : 'Designed For Every Business Type'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {isBn ? 'আপনার দোকান বা ব্যবসার ধরন অনুযায়ী বেছে নিন উপযুক্ত ফিচার।' : 'Customize your workspace dashboard with features specific to your industry.'}
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {solutionsList.map((sol, idx) => (
              <motion.div
                key={idx}
                variants={smoothFadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-4"
              >
                <div className="p-3 rounded-xl bg-slate-100/80 shrink-0">
                  {sol.icon}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">{sol.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{sol.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* HOW IT WORKS SECTION                                 */}
        {/* ---------------------------------------------------- */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-100/80 text-purple-800 text-xs font-bold tracking-wide uppercase">
              {isBn ? 'সহজ ধাপসমূহ' : 'Simple Setup'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isBn ? '৩টি সহজ ধাপে শুরু করুন' : 'Get Started in 3 Easy Steps'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {isBn ? 'কোনো জটিল সফটওয়্যার ইনস্টলেশনের প্রয়োজন নেই।' : 'No complex software installation required. Access from any phone or computer.'}
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
          >
            {howItWorksSteps.map((st, idx) => (
              <motion.div
                key={idx}
                variants={smoothFadeUp}
                whileHover={{ y: -4 }}
                className="relative bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="text-4xl font-extrabold text-emerald-600/30 mb-4 font-mono">
                    {st.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{st.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <span>{isBn ? 'সহজ সেটআপ' : 'Fast Setup'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* PRICING SECTION                                      */}
        {/* ---------------------------------------------------- */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center flex flex-col items-center gap-4 sm:gap-5 max-w-3xl mx-auto mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold tracking-wide uppercase shadow-2xs">
              {isBn ? 'মূল্য তালিকা' : 'Flexible Pricing'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isBn ? 'সহজ ও সাশ্রয়ী প্যাকেজ যেকোনো আকারের ব্যবসার জন্য' : 'Simple, Transparent Pricing For Any Store Size'}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 font-normal">
              {isBn ? '১৪ দিনের ফ্রি ট্রায়াল শুরু করুন। কোনো ক্রেডিট কার্ডের প্রয়োজন নেই।' : 'Start free for 14 days. No credit card required.'}
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
          >
            {pricingPlans.map((plan, idx) => (
              <motion.div
                key={idx}
                variants={smoothFadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 scale-105 z-10'
                    : 'bg-white border border-slate-200/90 shadow-sm hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold tracking-wider uppercase shadow-md">
                    {isBn ? 'জনপ্রিয় প্যাকেজ' : 'Most Popular'}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium">{plan.desc}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                    <span className="text-sm font-semibold text-slate-500">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 text-sm text-slate-600 mb-8">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/register"
                  className={`w-full py-3.5 text-center text-sm font-bold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* PRICING COMPARISON MATRIX TABLE                      */}
        {/* ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={smoothFadeUp}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-6"
          >
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">{isBn ? 'প্যাকেজের তুলনা' : 'Compare Plan Features'}</h3>
              <p className="text-sm text-slate-500">{isBn ? 'প্রতিটি প্যাকেজে কী কী ফিচার অন্তর্ভুক্ত রয়েছে।' : 'Everything included in each plan.'}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-900">
                    <th className="py-4 font-bold">{isBn ? 'ফিচার সমূহের তালিকা' : 'Feature Comparison'}</th>
                    <th className="py-4 font-bold text-center">Starter (৳99)</th>
                    <th className="py-4 font-bold text-center text-emerald-600">Business (৳199)</th>
                    <th className="py-4 font-bold text-center">Premium (৳499)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {matrixFeatures.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-medium">{item.name}</td>
                      <td className="text-center py-3.5">
                        {typeof item.starter === 'boolean' ? (
                          item.starter ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-xs font-semibold">{item.starter}</span>
                        )}
                      </td>
                      <td className="text-center py-3.5 bg-emerald-50/30">
                        {typeof item.business === 'boolean' ? (
                          item.business ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-xs font-bold text-emerald-700">{item.business}</span>
                        )}
                      </td>
                      <td className="text-center py-3.5">
                        {typeof item.premium === 'boolean' ? (
                          item.premium ? <Check className="w-5 h-5 text-emerald-600 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />
                        ) : (
                          <span className="text-xs font-semibold">{item.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </section>

        {/* ---------------------------------------------------- */}
        {/* FINAL CONVERSION CTA BANNER                          */}
        {/* Matches exact dark green gradient                    */}
        {/* ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={smoothScaleUp}
            className="relative rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#022c22] via-[#033a2d] to-[#011e17] border border-[#044433] p-10 sm:p-20 overflow-hidden shadow-2xl text-center space-y-6"
          >
            {/* Soft Ambient Radial Lights */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#00df89]/15 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#00df89]/15 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {isBn ? 'আপনার দোকান পরিচালনা সহজ করতে প্রস্তুত?' : 'Ready to Supercharge Your Shop Operations?'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isBn ? 'বাংলাদেশের ১০,০০০+ ব্যবসা প্রতিষ্ঠানের সাথে যুক্ত হয়ে আপনার আয় বাড়ান।' : 'Join over 10,000+ businesses across Bangladesh using Shopo to boost profits.'}
              </p>
              <div className="pt-4 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-[#011812] bg-[#00df89] hover:bg-[#00c97b] rounded-2xl shadow-xl shadow-[#00df89]/30 transition-all"
                  >
                    <span>{isBn ? 'ফ্রি অ্যাকাউন্ট খুলুন' : 'Get Started For Free'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
