import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const fetchUserAndNotifications = async () => {
    try {
      const userResponse = await api.get('/users/me/');
      setUser(userResponse.data);
      const notificationsResponse = await api.get('/notifications');
      setNotifications(notificationsResponse.data);
    } catch (error) {
      console.error('Failed to fetch user or notifications', error);
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserAndNotifications().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post('/token', params);
    localStorage.setItem('token', response.data.access_token);
    setLoading(true);
    await fetchUserAndNotifications();
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setNotifications([]);
  };
  
  const markNotificationAsRead = async (id) => {
    setNotifications(current => current.filter(n => n.id !== id));
    try {
        await api.post(`/notifications/${id}/read`);
    } catch (error) {
        console.error("Failed to mark notification as read", error);
        // Optionally, add the notification back to the list on failure
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, notifications, markNotificationAsRead }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};