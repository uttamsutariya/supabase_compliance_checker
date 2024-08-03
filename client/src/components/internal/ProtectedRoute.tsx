import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import useAuthCheck from '@/hooks/useAuthCheck';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  useAuthCheck();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedRoute;
