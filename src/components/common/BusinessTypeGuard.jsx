/**
 * @file BusinessTypeGuard.jsx
 * @description Route guard that restricts module access strictly to shops with matching business type.
 * Automatically intercepts manual URL changes and redirects users to their appropriate business dashboard.
 */
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import { useLanguage } from '@/context/LanguageContext';

export default function BusinessTypeGuard({ allowedTypes = [], children }) {
  const { mongoShop } = useAuth();
  const { activeShop } = useShop();
  const { lang } = useLanguage();
  const location = useLocation();

  const rawShopType = (
    mongoShop?.business_type ||
    activeShop?.id ||
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

  const currentType = isRestaurant ? 'restaurant' : isGym ? 'gym' : 'retail';

  // Check if current business type is permitted for this route
  const isAllowed = allowedTypes.length === 0 || allowedTypes.includes(currentType);

  useEffect(() => {
    if (!isAllowed) {
      const typeLabels = {
        restaurant: lang === 'bn' ? 'রেস্তোরাঁ' : 'Restaurant',
        gym: lang === 'bn' ? 'জিমন্যাসিয়াম' : 'Gym',
        retail: lang === 'bn' ? 'রিটেল / সাধারণ দোকান' : 'Retail / Standard Shop',
      };

      const requiredLabel = allowedTypes
        .map((t) => typeLabels[t] || t)
        .join(', ');

      toast.error(
        lang === 'bn'
          ? `অননুমোদিত: এই পেজটি শুধুমাত্র (${requiredLabel}) ব্যবসার জন্য প্রযোজ্য।`
          : `Access Denied: This module is exclusively for ${requiredLabel} businesses.`,
        { id: `biz-guard-${location.pathname}` }
      );
    }
  }, [isAllowed, allowedTypes, currentType, lang, location.pathname]);

  if (isAllowed) {
    return children;
  }

  // Smart Fallback Redirection based on actual shop type
  if (isRestaurant) {
    return <Navigate to="/restaurant/dashboard" replace />;
  }
  if (isGym) {
    return <Navigate to="/gym/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
