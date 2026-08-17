/**
 * @file ProtectedRoute.jsx
 * @description Route guard component ensuring authenticated access and enforcing business onboarding rules:
 *   - If user is unauthenticated -> redirect to /login
 *   - If user has already given business data -> block access to /onboarding/* and redirect to dashboard
 *   - If user has NOT completed business data -> block access to dashboard and redirect to /onboarding/business-data
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Store } from 'lucide-react';

export default function ProtectedRoute() {
  const { currentUser, mongoUser, mongoShop, hasShop, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFBFD] dark:bg-[#0B0F17] text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#00df89] text-[#011812] flex items-center justify-center font-bold shadow-lg shadow-[#00df89]/25 animate-pulse">
              <Store className="w-7 h-7" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-[#00df89]/30 border-t-[#00df89] animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Shopo<span className="text-[#00df89]">.</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Verifying session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login, but preserve the requested path in location.state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  const isGym = mongoShop?.business_type === 'gym' || localStorage.getItem('shopo_business_type') === 'gym';
  const dashboardTarget = isGym ? '/gym/dashboard' : '/dashboard';

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
