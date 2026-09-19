import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Verifying security credentials..." />
      </div>
    );
  }

  if (!user) {
    // Redirect unauthenticated user to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect authenticated non-admin user trying to access admin pages
    return (
      <div className="max-w-4xl mx-auto my-12 p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center">
        <div className="text-4xl mb-3">🛡️</div>
        <h2 className="text-xl font-bold text-rose-400 mb-2">Access Forbidden (403)</h2>
        <p className="text-slate-300 text-sm mb-6">
          You do not have administrative privileges to view this page. Backend RBAC policies restrict access to authorized administrators only.
        </p>
        <Navigate to="/products" replace />
      </div>
    );
  }

  return children;
}
