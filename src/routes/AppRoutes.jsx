/**
 * @file AppRoutes.jsx
 * @description Central routing definitions for Shopo with distinct routes for New Sale (/sales/new), Sales (/sales), Products (/products), POS, and Accounting.
 */
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

import {
  Landing, Home, Pricing, Features, Testimonials, Contact,
  Login, Register, ForgotPassword, ResetPassword, VerifyEmail, AuthAction,
  CreateShop, BusinessCategory, ShopDetails, CompleteSetup,
  Dashboard, Overview, Settings,
  Products, AddProduct, Categories, StockHistory,
  POS, Orders, NewSale, Transactions,
  Customers, CustomerDetails,
  Suppliers, Purchases,
  Employees, Salary,
  SalesReport, ProfitLoss, Analytics,
  GymDashboard, GymMembers, GymMemberProfile, GymMemberships,
  GymPackages, GymAttendance, GymPayments, GymTrainers,
  GymWorkouts, GymClasses, GymEquipment, GymExpenses,
  GymReports, GymSettings, GymProducts, GymSales, GymAccounting,
  NotFound
} from '@/pages';

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

      {/* Accessible Auth & Password Recovery Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Universal Firebase Action Handlers */}
      <Route path="/auth/action" element={<AuthAction />} />
      <Route path="/__/auth/action" element={<AuthAction />} />

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
          <Route path="/dashboard/settings" element={<Settings />} />

          {/* Dedicated Gym Business Module Routes */}
          <Route path="/gym/dashboard" element={<GymDashboard />} />
          <Route path="/gym/sales" element={<GymSales />} />
          <Route path="/gym/products" element={<GymProducts />} />
          <Route path="/gym/accounting" element={<GymAccounting />} />
          <Route path="/gym/members" element={<GymMembers />} />
          <Route path="/gym/members/:id" element={<GymMemberProfile />} />
          <Route path="/gym/memberships" element={<GymMemberships />} />
          <Route path="/gym/attendance" element={<GymAttendance />} />
          <Route path="/gym/payments" element={<GymPayments />} />
          <Route path="/gym/packages" element={<GymPackages />} />
          <Route path="/gym/trainers" element={<GymTrainers />} />
          <Route path="/gym/workout-plans" element={<GymWorkouts />} />
          <Route path="/gym/classes" element={<GymClasses />} />
          <Route path="/gym/equipment" element={<GymEquipment />} />
          <Route path="/gym/expenses" element={<GymExpenses />} />
          <Route path="/gym/reports" element={<GymReports />} />
          <Route path="/gym/settings" element={<GymSettings />} />

          {/* Distinct Core Feature Routes */}
          <Route path="/sales" element={<Orders />} />
          <Route path="/sales/new" element={<NewSale />} />
          <Route path="/sales/pos" element={<POS />} />
          <Route path="/pos" element={<POS />} />

          {/* Products & Inventory Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<Products />} />
          <Route path="/inventory" element={<Products />} />
          <Route path="/inventory/products" element={<Products />} />
          <Route path="/inventory/add-product" element={<Products />} />
          <Route path="/inventory/categories" element={<Categories />} />
          <Route path="/inventory/stock-history" element={<StockHistory />} />

          {/* Suppliers & Purchases */}
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />

          <Route path="/accounting" element={<ProfitLoss />} />

          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/details" element={<CustomerDetails />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/employees/salary" element={<Salary />} />
          <Route path="/reports/sales" element={<SalesReport />} />
          <Route path="/reports/profit-loss" element={<ProfitLoss />} />
          <Route path="/reports/analytics" element={<Analytics />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
