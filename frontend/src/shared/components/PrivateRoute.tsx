import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/auth-context';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return null;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
