/**
 * @file PublicRoute.jsx
 * @description Route guard for public guest routes (login, register) that redirects already-authenticated users.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/common/Loader';

export default function PublicRoute() {
  const { currentUser, mongoUser, mongoShop, hasShop, loading, isProfileLoading, isProfileChecked } = useAuth();

  const isVerifying = loading || isProfileLoading || (currentUser && currentUser.emailVerified && !isProfileChecked);

  if (isVerifying) {
    return <Loader message="Checking store session..." />;
  }

  if (currentUser && currentUser.emailVerified) {
    const hasStore = Boolean(mongoUser?.shop_id || mongoShop?._id || hasShop);
    const target = hasStore
      ? (mongoShop?.business_type === 'gym' ? '/gym/dashboard' : '/dashboard')
      : '/onboarding/business-data';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
