/**
 * @file PublicRoute.jsx
 * @description Route guard component for public guest routes.
 */
import { Outlet } from 'react-router-dom';

export default function PublicRoute() {
  return <Outlet />;
}
