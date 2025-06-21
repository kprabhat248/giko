import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Correctly imports your context hook
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css'; // Don't forget the CSS file from the previous step

const NotificationBell = () => {
  // 1. Get REAL data and functions directly from your AuthContext.
  // No more mock data or renaming variables.
  const { notifications, markNotificationAsRead } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleNotificationClick = (notification) => {
    // 2. Call the REAL markNotificationAsRead function from your context.
    // This will provide the optimistic UI update and send the API request.
    markNotificationAsRead(notification.id);
    
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  // 3. Prepare the list for seamless scrolling.
  // This is safe even if 'notifications' is initially an empty array.
  const listItems = notifications || [];
  const duplicatedNotifications = [...listItems, ...listItems];

  // Effect to close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="bell-button">
        🔔
        {/* Only show the count badge if there are notifications */}
        {listItems.length > 0 && (
          <span className="notification-count">{listItems.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          {listItems.length > 0 ? (
            <div className="notification-list-container">
              <div 
                className="notification-list-scroller" 
                style={{ animationDuration: `${listItems.length * 3.5}s` }}
              >
                {duplicatedNotifications.map((n, index) => (
                  <div 
                    key={`${n.id}-${index}`} 
                    className="notification-item" 
                    onClick={() => handleNotificationClick(n)}
                  >
                    {/* Assuming your notification object has a 'message' property */}
                    {n.message || 'Notification text is missing.'}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // This now correctly shows when the REAL notifications array is empty
            <div className="no-notifications">No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;