import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner'; // Optional: for a better loading experience

const DashboardRedirector = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />; // Or some other loading indicator
  }

  // Check the user's role and navigate accordingly
  if (user?.role === 'manager') {
    return <Navigate to="/manager/dashboard" replace />;
  }
  
  // Default to the employee dashboard for any other role or if role is not defined
  return <Navigate to="/employee/dashboard" replace />;
};

export default DashboardRedirector;