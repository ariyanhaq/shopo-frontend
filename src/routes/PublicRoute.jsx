/**
 * @file PublicRoute.jsx
 * @description Route guard for public guest routes (login, register) that redirects already-authenticated users.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function PublicRoute() {
  const { currentUser, mongoUser, mongoShop, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (currentUser) {
    const hasShop = Boolean(mongoUser?.shop_id || mongoShop?._id);
    const target = hasShop
      ? (mongoShop?.business_type === 'gym' ? '/gym/dashboard' : '/dashboard')
      : '/onboarding/business-data';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
