/**
 * @file shopTypesData.js
 * @description Comprehensive data dictionary for all 30 shop types supported in Shopo with Bangla labels.
 */

export const SHOP_CATEGORIES = [
  { id: 'all', label: 'All Businesses', labelBn: 'সব ধরণ' },
  { id: 'retail', label: 'Retail & Grocery', labelBn: 'খুচরা ও মুদি' },
  { id: 'fashion', label: 'Fashion & Beauty', labelBn: 'পোশাক ও বিউটি' },
  { id: 'food', label: 'Food & Dining', labelBn: 'খাবার ও রেস্তোরাঁ' },
  { id: 'tech', label: 'Tech & Electronics', labelBn: 'টেক ও ইলেকট্রনিক্স' },
  { id: 'services', label: 'Services & Fitness', labelBn: 'সেবা ও ফিটনেস' },
  { id: 'hardware', label: 'Hardware & Auto', labelBn: 'হার্ডওয়্যার ও অটো' },
  { id: 'wholesale', label: 'Wholesale & B2B', labelBn: 'পাইকারি ও বিটুবি' }
];

export const SHOP_TYPES = [
  {
    id: 'grocery',
    name: 'Grocery Store',
    nameBn: 'মুদি দোকান',
    category: 'retail',
    iconName: 'ShoppingBag',
    accentColor: '#00df89',
    tagline: 'Fresh produce, FMCG & daily essentials',
    taglineBn: 'নিত্যপ্রয়োজনীয় খাদ্যসামগ্রী ও মুদি পণ্য',
    description: 'Track perishable expiry dates, low stock alerts, barcode scanning & fast checkout.',
    descriptionBn: 'পণের মেয়াদ, কম স্টকের অ্যালার্ট, বারকোড স্ক্যানিং ও দ্রুত ক্যাশ মেমো রাখুন।',
    features: ['Expiry Alerts', 'Barcode Scanner', 'Weight & Unit Price', 'Supplier Purchasing'],
    featuresBn: ['মেয়াদের অ্যালার্ট', 'বারকোড স্ক্যানার', 'ওজন ও একক দাম', 'সাপ্লায়ার পারচেজ'],
    popular: true,
    stats: [
      { id: 'sales', label: "Today's Sales", value: '৳ 48,250', change: '+14.2%', isPositive: true },
      { id: 'revenue', label: 'Monthly Revenue', value: '৳ 1,240,500', change: '+8.5%', isPositive: true },
      { id: 'stock', label: 'Products in Stock', value: '3,840 items', change: '-45 today', isPositive: false },
      { id: 'lowStock', label: 'Low Stock Products', value: '18 items', change: 'Action needed', isPositive: false, alert: true },
      { id: 'expiring', label: 'Expiring Products', value: '12 batches', change: 'Next 7 days', isPositive: false, alert: true },
      { id: 'topItem', label: 'Top Selling Item', value: 'Miniket Rice 25kg', change: '140 bags', isPositive: true },
      { id: 'profit', label: 'Estimated Profit', value: '৳ 185,400', change: '+12.1%', isPositive: true },
      { id: 'expenses', label: 'Monthly Expenses', value: '৳ 62,300', change: '-3.2%', isPositive: true }
    ],
    quickActions: [
      { id: 'add_prod', label: 'Add Product', icon: 'Plus', color: 'bg-emerald-500/10 text-emerald-600 font-medium' },
      { id: 'sell_prod', label: 'Sell Product (POS)', icon: 'ShoppingCart', color: 'bg-blue-500/10 text-blue-600 font-medium' },
      { id: 'scan_barcode', label: 'Scan Barcode', icon: 'Scan', color: 'bg-purple-500/10 text-purple-600 font-medium' },
      { id: 'purchase_stock', label: 'Purchase Stock', icon: 'PackagePlus', color: 'bg-amber-500/10 text-amber-600 font-medium' },
      { id: 'customers', label: 'Customers', icon: 'Users', color: 'bg-indigo-500/10 text-indigo-600 font-medium' },
      { id: 'suppliers', label: 'Suppliers', icon: 'Truck', color: 'bg-rose-500/10 text-rose-600 font-medium' }
    ],
    widgets: ['expiring_products', 'low_stock_table', 'recent_sales'],
    sampleInventory: [
      { id: 'G-101', name: 'Fresh Milk 1L (Pran)', category: 'Dairy', stock: 45, unit: 'Pcs', price: '৳ 90', status: 'In Stock', expiry: '2026-08-10' },
      { id: 'G-102', name: 'Miniket Rice Premium 25kg', category: 'Grains', stock: 12, unit: 'Bags', price: '৳ 1,850', status: 'Low Stock', expiry: '2027-01-15' },
      { id: 'G-103', name: 'Sunflower Oil 5L (Rupchanda)', category: 'Oil & Ghee', stock: 28, unit: 'Bottles', price: '৳ 890', status: 'In Stock', expiry: '2026-11-20' },
      { id: 'G-104', name: 'ACI Pure Salt 1kg', category: 'Spices', stock: 120, unit: 'Pcs', price: '৳ 42', status: 'In Stock', expiry: '2028-04-01' },
      { id: 'G-105', name: 'Farm Fresh Eggs (Layer)', category: 'Poultry', stock: 8, unit: 'Trays', price: '৳ 390', status: 'Low Stock', expiry: '2026-08-08' }
    ]
  },
  {
    id: 'stationery',
    name: 'Stationery Shop',
    nameBn: 'স্টেশনরি ও বইয়ের দোকান',
    category: 'retail',
    iconName: 'PenTool',
    accentColor: '#3b82f6',
    tagline: 'Books, school supplies & office accessories',
    taglineBn: 'বই, খাতা, কলম ও অফিসের জিনিসপত্র',
    description: 'Manage thousands of small SKUs, pen bundles, printing services & student tabs.',
    descriptionBn: 'হাজারো খুচরা পণ্য, খাতা-কলমের হিসাব ও প্রিন্টিং বিল সংরক্ষণ করুন।',
    features: ['Bundle Pricing', 'Book ISBN Search', 'Student Credit Log', 'Print Memos'],
    featuresBn: ['বান্ডেল প্রাইজ', 'বইয়ের আইএসবিএন', 'স্টুডেন্ট ডিউ লগ', 'প্রিন্ট মেমো'],
    stats: [
      { id: 'sales', label: "Today's Sales", value: '৳ 18,400', change: '+9.1%', isPositive: true },
      { id: 'revenue', label: 'Monthly Revenue', value: '৳ 410,200', change: '+5.4%', isPositive: true },
      { id: 'stock', label: 'SKU Count', value: '6,420 items', change: '+120 new', isPositive: true },
      { id: 'lowStock', label: 'Low Stock SKUs', value: '42 items', change: 'Needs order', isPositive: false, alert: true },
      { id: 'due', label: 'Student Due Records', value: '৳ 14,200', change: '18 students', isPositive: false },
      { id: 'topItem', label: 'Top Item', value: 'Matador Hi-School Pen', change: '450 pcs', isPositive: true },
      { id: 'profit', label: 'Est. Net Profit', value: '৳ 78,500', change: '+7.8%', isPositive: true },
      { id: 'copies', label: 'Photocopy Revenue', value: '৳ 6,400', change: '+14%', isPositive: true }
    ],
    quickActions: [
      { id: 'quick_sale', label: 'Quick Pen/Paper Sale', icon: 'Zap', color: 'bg-[#00df89]/10 text-emerald-600 font-medium' },
      { id: 'print_memo', label: 'Print Cash Memo', icon: 'Printer', color: 'bg-blue-500/10 text-blue-600 font-medium' },
      { id: 'due_entry', label: 'Bakeya Khata Entry', icon: 'BookOpen', color: 'bg-[#00df89]/10 text-emerald-600 font-medium' },
      { id: 'bulk_import', label: 'Import Excel Items', icon: 'FileSpreadsheet', color: 'bg-amber-500/10 text-amber-600 font-medium' }
    ],
    widgets: ['stationery_quick_pos', 'due_khata_table'],
    sampleInventory: [
      { id: 'S-101', name: 'Matador Pinpoint Ballpen Box', category: 'Pens', stock: 85, unit: 'Boxes', price: '৳ 240', status: 'In Stock' },
      { id: 'S-102', name: 'Bashundhara A4 Paper 80GSM (Rim)', category: 'Paper', stock: 42, unit: 'Rims', price: '৳ 380', status: 'In Stock' },
      { id: 'S-103', name: 'Exercise Notebook 120 Pages', category: 'Notebooks', stock: 300, unit: 'Pcs', price: '৳ 45', status: 'In Stock' }
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing & Fashion',
    nameBn: 'পোশাকের দোকান',
    category: 'fashion',
    iconName: 'Shirt',
    accentColor: '#ec4899',
    tagline: 'Apparel, fashion collections & accessories',
    taglineBn: 'শার্ট, প্যান্ট, শাড়ি ও ফ্যাশন এক্সেসরিজ',
    description: 'Multi-variant sizes (S/M/L/XL), color tagging, discount tags & season catalog.',
    descriptionBn: 'সাইজ (S/M/L/XL), কালার ভ্যারিয়েন্ট, ডিসকাউন্ট ছাড় ও ক্যাশ মেমো প্রিন্ট।',
    features: ['Size & Color Matrix', 'Barcode Tags', 'Seasonal Discounts', 'Exchange Guarantee'],
    featuresBn: ['সাইজ ও কালার ম্যাট্রিক্স', 'বারকোড ট্যাগ', 'ডিসকাউন্ট ট্যাগ', 'এক্সচেঞ্জ গ্যারান্টি'],
    popular: true,
    stats: [
      { id: 'sales', label: "Today's Sales", value: '৳ 64,800', change: '+22.4%', isPositive: true },
      { id: 'revenue', label: 'Monthly Revenue', value: '৳ 1,840,000', change: '+16.5%', isPositive: true },
      { id: 'stock', label: 'Total Apparel Pieces', value: '1,420 pcs', change: '-32 today', isPositive: false },
      { id: 'variants', label: 'Active Style Variants', value: '380 styles', change: 'In Stock', isPositive: true },
      { id: 'returns', label: 'Exchanges Today', value: '3 items', change: 'Resolved', isPositive: true },
      { id: 'topItem', label: 'Best Seller', value: 'Slim Fit Cotton Shirt', change: '48 pcs', isPositive: true },
      { id: 'profit', label: 'Margin Profit', value: '৳ 420,000', change: '+18.2%', isPositive: true },
      { id: 'discount', label: 'Discounts Given', value: '৳ 14,500', change: 'Eid Promo', isPositive: false }
    ],
    quickActions: [
      { id: 'new_apparel', label: 'Add New Clothing Item', icon: 'Shirt', color: 'bg-pink-500/10 text-pink-600 font-medium' },
      { id: 'print_tag', label: 'Print Barcode Price Tags', icon: 'Tag', color: 'bg-purple-500/10 text-purple-600 font-medium' },
      { id: 'pos_checkout', label: 'Fashion POS Checkout', icon: 'ShoppingBag', color: 'bg-emerald-500/10 text-emerald-600 font-medium' }
    ],
    widgets: ['clothing_variants', 'size_stock_matrix'],
    sampleInventory: [
      { id: 'C-101', name: 'Mens Slim Fit Casual Shirt (Blue/M)', category: 'Shirts', stock: 15, unit: 'Pcs', price: '৳ 1,250', status: 'In Stock' },
      { id: 'C-102', name: 'Ladies Jamdani Cotton Saree (Red)', category: 'Sarees', stock: 6, unit: 'Pcs', price: '৳ 4,500', status: 'Low Stock' },
      { id: 'C-103', name: 'Denim Stretch Jeans 32"', category: 'Pants', stock: 24, unit: 'Pcs', price: '৳ 1,850', status: 'In Stock' }
    ]
  },
  {
    id: 'gym',
    name: 'Gym & Fitness Center',
    nameBn: 'জিমন্যাসিয়াম ও ফিটনেস সেন্টার',
    category: 'services',
    iconName: 'Dumbbell',
    accentColor: '#ef4444',
    tagline: 'Membership tracking, check-ins, trainers & class schedules',
    taglineBn: 'মেম্বারশিপ, অ্যাটেনডেন্স, ট্রেইনার ও ওয়ার্কআউট প্ল্যান',
    description: 'Complete member management, expiry alerts, check-in logs, trainer assignment & workout routines.',
    descriptionBn: 'মেম্বারশিপ অটোমেশন, অ্যাটেনডেন্স চেক-ইন, ট্রেইনার ও ফিটনেস প্ল্যান।',
    features: ['Member Management', 'QR & One-Click Check-In', 'Packages & Freeze', 'Workout Plans & Classes'],
    featuresBn: ['মেম্বারশিপ ট্র্যাকিং', 'অ্যাটেনডেন্স চেক-ইন', 'প্যাকেজ ও রিনিউ', 'ওয়ার্কআউট প্ল্যান ও ক্লাস'],
    popular: true,
    stats: [
      { id: 'members', label: 'Total Members', value: '450', change: '+18 this month', isPositive: true },
      { id: 'active', label: 'Active Members', value: '382', change: '84.8%', isPositive: true },
      { id: 'attendance', label: "Today's Attendance", value: '68', change: '+12 vs yesterday', isPositive: true },
      { id: 'expiring', label: 'Expiring Soon', value: '14 members', change: 'Next 7 days', isPositive: false, alert: true },
      { id: 'revenue', label: 'Revenue This Month', value: '৳ 385,000', change: '+15.4%', isPositive: true },
      { id: 'todayRevenue', label: "Today's Revenue", value: '৳ 24,500', change: '8 payments', isPositive: true },
      { id: 'pending', label: 'Pending Dues', value: '৳ 42,000', change: '12 members', isPositive: false, alert: true },
      { id: 'newMembers', label: 'New Members (Mo)', value: '34', change: '+22.5%', isPositive: true }
    ],
    quickActions: [
      { id: 'add_member', label: 'Add Member', icon: 'UserPlus', color: 'bg-emerald-500/10 text-emerald-600 font-medium' },
      { id: 'check_in', label: 'Check In Member', icon: 'QrCode', color: 'bg-[#00df89]/10 text-emerald-600 font-medium' },
      { id: 'record_payment', label: 'Record Payment', icon: 'CreditCard', color: 'bg-blue-500/10 text-blue-600 font-medium' },
      { id: 'add_trainer', label: 'Add Trainer', icon: 'UserCheck', color: 'bg-purple-500/10 text-purple-600 font-medium' },
      { id: 'add_package', label: 'Add Package', icon: 'Package', color: 'bg-amber-500/10 text-amber-600 font-medium' }
    ],
    widgets: ['gym_members_queue', 'gym_overview_stats', 'gym_membership_expiry'],
    sampleInventory: []
  }
];

export function getShopTypeById(id) {
  return SHOP_TYPES.find(s => s.id === id) || SHOP_TYPES[0];
}
