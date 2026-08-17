import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireSetup = false }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If the route requires business data setup, redirect them to the onboarding wizard
  if (requireSetup && !currentUser.businessData) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
