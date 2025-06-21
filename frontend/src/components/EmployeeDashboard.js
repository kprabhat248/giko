import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Import Components
import FeedbackCard from './FeedbackCard';
import RequestFeedbackModal from './RequestFeedbackModal';
import PeerFeedbackFormModal from './PeerFeedbackFormModal';
import Spinner from './Spinner';
import Background from './Background'; // <-- Import the new background

// Import Icons (You'll need an icon library like 'react-feather' or your own SVGs)
// As a placeholder, we'll use text, but you can easily swap these out.
// Example: import { LogOut, Settings, MessageSquare } from 'react-feather';

// Import the new styles for this page
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState([]);
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setRequestModalOpen] = useState(false);
  const [isPeerModalOpen, setPeerModalOpen] = useState(false);
  
  const fetchData = async () => {
    // ... (Your fetchData logic remains the same)
    try {
      setLoading(true);
      const [feedbackRes, teammatesRes] = await Promise.all([
        api.get('/employee/feedback'),
        api.get('/employee/teammates')
      ]);
      setFeedbackList(feedbackRes.data);
      setTeammates(teammatesRes.data);
    } catch (error) {
      console.error('Failed to fetch employee data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (id) => {
    // ... (Your handleAcknowledge logic remains the same)
    try {
      await api.post(`/employee/feedback/${id}/acknowledge`);
      setFeedbackList(list => list.map(fb => fb.id === id ? { ...fb, is_acknowledged: true } : fb));
    } catch (error) {
      console.error('Failed to acknowledge feedback', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <Spinner />;

  return (
    <div className="page-container">
      <Background />
      
      {/* The main glass panel for the entire dashboard */}
      <div className="dashboard-panel">
        
        {/* === Left Sidebar for Navigation === */}
        <aside className="dashboard-sidebar">
          <div>
            <div className="sidebar-logo">FeedbackTool</div>
            <nav className="sidebar-nav">
              <Link to="/employee/dashboard" className="sidebar-link active">
                {/* <MessageSquare size={20} /> */}
                <span>My Feedback</span>
              </Link>
              {/* Add more links here as your app grows */}
            </nav>
          </div>
          <div className="sidebar-footer">
            <Link to="/settings" className="sidebar-link">
              {/* <Settings size={20} /> */}
              <span>Settings</span>
            </Link>
            <button onClick={handleLogout} className="sidebar-link logout-button">
              {/* <LogOut size={20} /> */}
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* === Main Content Area === */}
        <main className="dashboard-content">
          <header className="content-header">
            <h1>My Feedback</h1>
            <div className="header-actions">
              <button className="button button-secondary" onClick={() => setPeerModalOpen(true)}>
                Give Peer Feedback
              </button>
              <button className="button button-primary" onClick={() => setRequestModalOpen(true)}>
                Request Feedback
              </button>
            </div>
          </header>
          
          <div className="feedback-list">
            {feedbackList.length > 0 ? (
              feedbackList.map(fb => (
                <FeedbackCard key={fb.id} feedback={fb} onAcknowledge={handleAcknowledge} />
              ))
            ) : (
              <div className="info-card">
                <h3>Nothing to see here yet!</h3>
                <p>You haven't received any feedback. Why not ask your manager for some? Just click the "Request Feedback" button.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <RequestFeedbackModal
        isOpen={isRequestModalOpen}
        onRequestClose={() => setRequestModalOpen(false)}
      />

      <PeerFeedbackFormModal
        isOpen={isPeerModalOpen}
        onRequestClose={() => setPeerModalOpen(false)}
        teammates={teammates}
      />
    </div>
  );
};

export default EmployeeDashboard;