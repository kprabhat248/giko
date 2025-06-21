import React from 'react';
import { useAuth } from '../context/AuthContext';
import ManagerDashboard from '../components/ManagerDashboard';
import EmployeeDashboard from '../components/EmployeeDashboard';
import Spinner from '../components/Spinner';

const DashboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }
  if (!user) {
    return <div>Error: No user data.</div>;
  }
  
  // Wrap the dashboard in the new layout class
  return (
    <div className="dashboard-layout">
        {user.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
    </div>
  );
};

export default DashboardPage;