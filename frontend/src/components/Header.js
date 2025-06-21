import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
// Import the new CSS file
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render a header on the login/signup page
  if (!user) {
    return null;
  }

  return (
    // We use a wrapper to ensure the header doesn't get clipped if we use border-radius
    <div className="header-container">
      <header className="header-glass">
        <Link to="/" className="header-logo">
          FeedbackTool
        </Link>
        <div className="user-info">
          <NotificationBell />
          <span className="user-name">{user.full_name}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
    </div>
  );
};

export default Header;