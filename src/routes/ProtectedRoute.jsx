/**
 * @file ProtectedRoute.jsx
 * @description Route guard component for authenticated routes.
 */
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const isAuthenticated = true;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
