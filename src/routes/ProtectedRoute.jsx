/**
 * @file ProtectedRoute.jsx
 * @description Route guard component ensuring authenticated access and enforcing business onboarding rules:
 *   - If user is unauthenticated -> redirect to /login
 *   - If user has already given business data -> block access to /onboarding/* and redirect to dashboard
 *   - If user has NOT completed business data -> block access to dashboard and redirect to /onboarding/business-data
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/common/Loader';

export default function ProtectedRoute() {
  const { currentUser, mongoUser, mongoShop, hasShop, loading, isProfileChecked } = useAuth();
  const location = useLocation();

  const isVerifying = loading || (currentUser && currentUser.emailVerified && !isProfileChecked);

  if (isVerifying) {
    return <Loader message="Checking store data & profile..." />;
  }

  if (!currentUser) {
    // Redirect to login, but preserve the requested path in location.state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce email verification on protected app routes
  if (!currentUser.emailVerified) {
    return <Navigate to="/verify-email" state={{ email: currentUser.email }} replace />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const isGym = mongoShop?.business_type === 'gym' || localStorage.getItem('shopo_business_type') === 'gym';
  const isRestaurant = mongoShop?.business_type === 'restaurant' || localStorage.getItem('shopo_business_type') === 'restaurant';
  const dashboardTarget = isGym ? '/gym/dashboard' : isRestaurant ? '/restaurant/dashboard' : '/dashboard';

  // Rule 1: If user already has given business data, block access to onboarding and redirect to dashboard
  if (isOnboardingRoute && hasShop) {
    return <Navigate to={dashboardTarget} replace />;
  }

  // Rule 2: If user has NOT given business data yet, block access to dashboard and redirect to onboarding
  if (!isOnboardingRoute && !hasShop) {
    return <Navigate to="/onboarding/business-data" replace />;
  }

  return <Outlet />;
}
