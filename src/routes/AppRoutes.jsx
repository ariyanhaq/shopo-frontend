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
import BusinessTypeGuard from '@/components/common/BusinessTypeGuard';

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

          {/* Dedicated Gym Business Module Routes (Restricted strictly to Gym accounts) */}
          <Route path="/gym/dashboard" element={<BusinessTypeGuard allowedTypes={['gym']}><GymDashboard /></BusinessTypeGuard>} />
          <Route path="/gym/sales" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="orders"><GymSales /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/products" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="products"><GymProducts /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/accounting" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="accounting"><GymAccounting /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/members" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="customers"><GymMembers /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/members/:id" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="customers"><GymMemberProfile /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/memberships" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="customers"><GymMemberships /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/attendance" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="employees"><GymAttendance /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/payments" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="payments"><GymPayments /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/packages" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="products"><GymPackages /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/trainers" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="employees"><GymTrainers /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/workout-plans" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="employees"><GymWorkouts /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/classes" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="employees"><GymClasses /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/equipment" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="products"><GymEquipment /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/expenses" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="expenses"><GymExpenses /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/reports" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="accounting"><GymReports /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/gym/settings" element={<BusinessTypeGuard allowedTypes={['gym']}><PermissionGuard permission="settings"><GymSettings /></PermissionGuard></BusinessTypeGuard>} />

          {/* Dedicated Restaurant & Cafe Business Module Routes (Restricted strictly to Restaurant accounts) */}
          <Route path="/restaurant/dashboard" element={<BusinessTypeGuard allowedTypes={['restaurant']}><RestaurantDashboard /></BusinessTypeGuard>} />
          <Route path="/restaurant/tables" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="orders"><RestaurantTables /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/pos" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission={['orders', 'pos']}><RestaurantPOS /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/kds" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="orders"><RestaurantKDS /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/menu" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="products"><RestaurantMenu /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/recipes" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="products"><RestaurantRecipes /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/inventory" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="products"><RestaurantInventory /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/reservations" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="customers"><RestaurantReservations /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/orders" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="orders"><RestaurantOrders /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/staff" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="employees"><RestaurantStaff /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/reports" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="accounting"><RestaurantReports /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/restaurant/settings" element={<BusinessTypeGuard allowedTypes={['restaurant']}><PermissionGuard permission="settings"><RestaurantSettings /></PermissionGuard></BusinessTypeGuard>} />

          {/* Retail & Standard Shop Routes (Restricted from Restaurant & Gym) */}
          <Route path="/sales" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission={['orders', 'pos']}><Orders /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/sales/new" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission={['orders', 'pos']}><NewSale /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/sales/pos" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission={['orders', 'pos']}><POS /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/pos" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission={['orders', 'pos']}><POS /></PermissionGuard></BusinessTypeGuard>} />

          {/* Products & Inventory Routes */}
          <Route path="/products" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Products /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/products/add" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Products /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/inventory" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Products /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/inventory/products" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Products /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/inventory/add-product" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Products /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/inventory/categories" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><Categories /></PermissionGuard></BusinessTypeGuard>} />
          <Route path="/inventory/stock-history" element={<BusinessTypeGuard allowedTypes={['retail']}><PermissionGuard permission="products"><StockHistory /></PermissionGuard></BusinessTypeGuard>} />

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
