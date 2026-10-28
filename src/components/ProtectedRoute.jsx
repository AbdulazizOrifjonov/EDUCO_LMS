import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage text="Checking authentication..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, verify user's role (case-insensitive & trimmed)
  if (allowedRoles.length > 0) {
    const rawRole = profile?.role || user?.user_metadata?.role || '';
    const userRole = String(rawRole).toLowerCase().trim();
    const hasAccess = allowedRoles.some((r) => String(r).toLowerCase().trim() === userRole);
    if (!userRole || !hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
