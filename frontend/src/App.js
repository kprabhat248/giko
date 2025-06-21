import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Components
import Header from './components/Header';
import Background from './components/Background';
import Spinner from './components/Spinner'; // Make sure this is imported

// Import Pages & Redirector
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard'; // Import the new dashboard
import DashboardRedirector from './components/DashboardRedirector'; // Import our new smart redirector

// A wrapper for routes that require authentication
// Using an Outlet-based protected route is more idiomatic for React Router v6
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        {/* We can manage layout conditionally based on auth status */}
        <MainLayout />
      </Router>
    </AuthProvider>
  );
};

// A layout component to provide context (user, background, etc.)
const MainLayout = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Background and Header are only shown for logged-in users */}
      {user && <Background />}
      {user && <Header />}
      
      <main>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route 
            path="/employee/dashboard" 
            element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/manager/dashboard" 
            element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} 
          />

          {/* 
            FIX IS HERE: The root path now goes to our smart redirector.
            It will decide whether to send the user to the manager or employee page.
          */}
          <Route 
            path="/" 
            element={<ProtectedRoute><DashboardRedirector /></ProtectedRoute>} 
          />
          
          {/* Catch-all for any other path also goes to the redirector */}
          <Route 
            path="*" 
            element={<ProtectedRoute><DashboardRedirector /></ProtectedRoute>} 
          />
        </Routes>
      </main>
    </>
  );
};

export default App;