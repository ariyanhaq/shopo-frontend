/**
 * @file AppRoutes.jsx
 * @description Central routing definitions for Shopo with distinct routes for New Sale (/sales/new), Sales (/sales), Products (/products), POS, and Accounting.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import {
  Landing, Home, Pricing, Features, Testimonials, Contact,
  Login, Register, ForgotPassword, ResetPassword, VerifyEmail, AuthAction,
  CreateShop, BusinessCategory, ShopDetails, CompleteSetup,
  Dashboard, Overview, Settings, ProfileSettings, StoreSettings,
  Products, AddProduct, Categories, StockHistory,
  POS, Orders, NewSale, Transactions,
  Customers, CustomerDetails, Members,
  Suppliers, Purchases,
  Employees, Salary, Expenses, Users,
  SalesReport, ProfitLoss, Analytics,
  GymDashboard, GymMembers, GymMemberProfile, GymMemberships,
  GymPackages, GymAttendance, GymPayments, GymTrainers,
  GymWorkouts, GymClasses, GymEquipment, GymExpenses,
  GymReports, GymSettings, GymProducts, GymSales, GymAccounting,
  RestaurantDashboard, RestaurantTables, RestaurantPOS, RestaurantKDS,
  RestaurantMenu, RestaurantRecipes, RestaurantInventory, RestaurantReservations,
  RestaurantOrders, RestaurantStaff, RestaurantReports, RestaurantSettings,
  NotFound
} from '@/pages';

import PermissionGuard from '@/components/common/PermissionGuard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Pages */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/contact" element={<Contact />} />
      </Route>

      {/* Auth Guest Pages (Only Login & Register redirect when logged in) */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      {/* Password Reset & Account Recovery Flows */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/action" element={<AuthAction />} />

      {/* Onboarding Flow (Full screen experience) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding/business-data" element={<BusinessCategory />} />
        <Route path="/onboarding/business-category" element={<BusinessCategory />} />
        <Route path="/onboarding/select-shop" element={<BusinessCategory />} />
        <Route path="/onboarding/create-shop" element={<CreateShop />} />
        <Route path="/onboarding/shop-details" element={<ShopDetails />} />
        <Route path="/onboarding/complete-setup" element={<CompleteSetup />} />
      </Route>

      {/* Authenticated Dashboard Ecosystem */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/overview" element={<Overview />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />
          <Route path="/settings/store" element={<PermissionGuard permission="settings"><StoreSettings /></PermissionGuard>} />
          <Route path="/store-settings" element={<Navigate to="/settings/store" replace />} />
          <Route path="/dashboard/settings" element={<Navigate to="/settings/store" replace />} />
          <Route path="/settings" element={<Navigate to="/settings/store" replace />} />

          {/* Dedicated Gym Business Module Routes */}
          <Route path="/gym/dashboard" element={<GymDashboard />} />
          <Route path="/gym/sales" element={<PermissionGuard permission="orders"><GymSales /></PermissionGuard>} />
          <Route path="/gym/products" element={<PermissionGuard permission="products"><GymProducts /></PermissionGuard>} />
          <Route path="/gym/accounting" element={<PermissionGuard permission="accounting"><GymAccounting /></PermissionGuard>} />
          <Route path="/gym/members" element={<PermissionGuard permission="customers"><GymMembers /></PermissionGuard>} />
          <Route path="/gym/members/:id" element={<PermissionGuard permission="customers"><GymMemberProfile /></PermissionGuard>} />
          <Route path="/gym/memberships" element={<PermissionGuard permission="customers"><GymMemberships /></PermissionGuard>} />
          <Route path="/gym/attendance" element={<PermissionGuard permission="employees"><GymAttendance /></PermissionGuard>} />
          <Route path="/gym/payments" element={<PermissionGuard permission="payments"><GymPayments /></PermissionGuard>} />
          <Route path="/gym/packages" element={<PermissionGuard permission="products"><GymPackages /></PermissionGuard>} />
          <Route path="/gym/trainers" element={<PermissionGuard permission="employees"><GymTrainers /></PermissionGuard>} />
          <Route path="/gym/workout-plans" element={<PermissionGuard permission="employees"><GymWorkouts /></PermissionGuard>} />
          <Route path="/gym/classes" element={<PermissionGuard permission="employees"><GymClasses /></PermissionGuard>} />
          <Route path="/gym/equipment" element={<PermissionGuard permission="products"><GymEquipment /></PermissionGuard>} />
          <Route path="/gym/expenses" element={<PermissionGuard permission="expenses"><GymExpenses /></PermissionGuard>} />
          <Route path="/gym/reports" element={<PermissionGuard permission="accounting"><GymReports /></PermissionGuard>} />
          <Route path="/gym/settings" element={<PermissionGuard permission="settings"><GymSettings /></PermissionGuard>} />

          {/* Dedicated Restaurant & Cafe Business Module Routes */}
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/tables" element={<PermissionGuard permission="orders"><RestaurantTables /></PermissionGuard>} />
          <Route path="/restaurant/pos" element={<PermissionGuard permission={['orders', 'pos']}><RestaurantPOS /></PermissionGuard>} />
          <Route path="/restaurant/kds" element={<PermissionGuard permission="orders"><RestaurantKDS /></PermissionGuard>} />
          <Route path="/restaurant/menu" element={<PermissionGuard permission="products"><RestaurantMenu /></PermissionGuard>} />
          <Route path="/restaurant/recipes" element={<PermissionGuard permission="products"><RestaurantRecipes /></PermissionGuard>} />
          <Route path="/restaurant/inventory" element={<PermissionGuard permission="products"><RestaurantInventory /></PermissionGuard>} />
          <Route path="/restaurant/reservations" element={<PermissionGuard permission="customers"><RestaurantReservations /></PermissionGuard>} />
          <Route path="/restaurant/orders" element={<PermissionGuard permission="orders"><RestaurantOrders /></PermissionGuard>} />
          <Route path="/restaurant/staff" element={<PermissionGuard permission="employees"><RestaurantStaff /></PermissionGuard>} />
          <Route path="/restaurant/reports" element={<PermissionGuard permission="accounting"><RestaurantReports /></PermissionGuard>} />
          <Route path="/restaurant/settings" element={<PermissionGuard permission="settings"><RestaurantSettings /></PermissionGuard>} />

          {/* Distinct Core Feature Routes */}
          <Route path="/sales" element={<PermissionGuard permission={['orders', 'pos']}><Orders /></PermissionGuard>} />
          <Route path="/sales/new" element={<PermissionGuard permission={['orders', 'pos']}><NewSale /></PermissionGuard>} />
          <Route path="/sales/pos" element={<PermissionGuard permission={['orders', 'pos']}><POS /></PermissionGuard>} />
          <Route path="/pos" element={<PermissionGuard permission={['orders', 'pos']}><POS /></PermissionGuard>} />

          {/* Products & Inventory Routes */}
          <Route path="/products" element={<PermissionGuard permission="products"><Products /></PermissionGuard>} />
          <Route path="/products/add" element={<PermissionGuard permission="products"><Products /></PermissionGuard>} />
          <Route path="/inventory" element={<PermissionGuard permission="products"><Products /></PermissionGuard>} />
          <Route path="/inventory/products" element={<PermissionGuard permission="products"><Products /></PermissionGuard>} />
          <Route path="/inventory/add-product" element={<PermissionGuard permission="products"><Products /></PermissionGuard>} />
          <Route path="/inventory/categories" element={<PermissionGuard permission="products"><Categories /></PermissionGuard>} />
          <Route path="/inventory/stock-history" element={<PermissionGuard permission="products"><StockHistory /></PermissionGuard>} />

          {/* Suppliers & Purchases */}
          <Route path="/suppliers" element={<PermissionGuard permission="suppliers"><Suppliers /></PermissionGuard>} />
          <Route path="/purchases" element={<PermissionGuard permission="purchases"><Purchases /></PermissionGuard>} />

          <Route path="/financial-reports" element={<PermissionGuard permission="accounting"><ProfitLoss /></PermissionGuard>} />
          <Route path="/accounting" element={<Navigate to="/financial-reports" replace />} />

          <Route path="/customers" element={<PermissionGuard permission="customers"><Customers /></PermissionGuard>} />
          <Route path="/customers/details" element={<PermissionGuard permission="customers"><CustomerDetails /></PermissionGuard>} />
          <Route path="/members" element={<PermissionGuard permission="customers"><Members /></PermissionGuard>} />
          <Route path="/membership" element={<PermissionGuard permission="customers"><Members /></PermissionGuard>} />
          <Route path="/employees" element={<PermissionGuard permission="employees"><Employees /></PermissionGuard>} />
          <Route path="/employees/salary" element={<PermissionGuard permission="employees"><Salary /></PermissionGuard>} />
          <Route path="/expenses" element={<PermissionGuard permission="expenses"><Expenses /></PermissionGuard>} />
          <Route path="/users" element={<PermissionGuard requireAdmin={true}><Users /></PermissionGuard>} />
          <Route path="/users-devices" element={<Navigate to="/users" replace />} />
          <Route path="/devices" element={<Navigate to="/users" replace />} />
          <Route path="/reports/sales" element={<PermissionGuard permission={['orders', 'accounting']}><SalesReport /></PermissionGuard>} />
          <Route path="/reports/profit-loss" element={<PermissionGuard permission="accounting"><ProfitLoss /></PermissionGuard>} />
          <Route path="/reports/analytics" element={<PermissionGuard permission="accounting"><Analytics /></PermissionGuard>} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
