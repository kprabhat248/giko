import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// Import Components
import FeedbackFormModal from './FeedbackFormModal';
import Spinner from './Spinner';
import SentimentChart from './SentimentChart';

// Import Icons
import UsersIcon from '../icons/UsersIcon';
import RequestIcon from '../icons/RequestIcon';
import PeersIcon from '../icons/PeersIcon';

// Import the specific styles
import './ManagerDashboard.css';

// StatsGrid component (no changes needed)
const StatsGrid = ({ data }) => (
  <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-icon-wrapper blue"><UsersIcon /></div>
      <div className="stat-info">
        <div className="stat-value">{data.team_members.length}</div>
        <div className="stat-label">Team Members</div>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper orange"><RequestIcon /></div>
      <div className="stat-info">
        <div className="stat-value">{data.feedback_requests.length}</div>
        <div className="stat-label">Pending Requests</div>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon-wrapper purple"><PeersIcon /></div>
      <div className="stat-info">
        <div className="stat-value">{data.peer_feedback.length}</div>
        <div className="stat-label">Peer Feedback Queue</div>
      </div>
    </div>
  </div>
);

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const fetchData = async () => {
    try {
      const response = await api.get('/manager/dashboard');
      // Log the data as soon as it's received to check its structure
      console.log("API Response Data:", response.data);
      setData(response.data);
    } catch (error)
    {
      console.error('Failed to fetch manager dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleOpenModal = (feedback = null) => {
    setSelectedFeedback(feedback);
    setModalOpen(true);
  };
  
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedFeedback(null);
    fetchData();
  };

  if (loading) return <Spinner />;
  if (!data) return <div className="content-card">Could not load dashboard data. Please try refreshing.</div>;

  const renderSentimentDot = (sentiment) => {
    const sentimentClass = `sentiment-dot ${sentiment || 'neutral'}`;
    return <span className={sentimentClass} title={`Sentiment: ${sentiment}`}></span>;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'team':
        return data.team_members.map(member => (
          <div key={member.id} className="data-list-item">
            <div className="item-avatar blue">{member.full_name.charAt(0)}</div>
            <div className="item-content">
              <strong>{member.full_name}</strong>
              <span>{member.email}</span>
            </div>
            <div className="item-action">
              <button className="button button-small" onClick={() => handleOpenModal({ employee_id: member.id })}>
                Give Feedback
              </button>
            </div>
          </div>
        ));
      
      case 'history':
        return data.feedback_history?.length > 0 ? data.feedback_history.map(fb => (
          <div key={fb.id} className="data-list-item">
            {renderSentimentDot(fb.sentiment)}
            <div className="item-content">
              <strong>For: {fb.employee_full_name}</strong>
              <span className="peer-feedback-text">
                "{(fb.strengths ?? '').substring(0, 80)}{(fb.strengths?.length ?? 0) > 80 ? '...' : ''}"
              </span>
              <span>On {new Date(fb.created_at).toLocaleDateString()}</span>
            </div>
            <div className="item-action">
              <button className="button button-secondary button-small" onClick={() => handleOpenModal(fb)}>
                Edit
              </button>
            </div>
          </div>
        )) : <p className="empty-state">You haven't submitted any feedback yet.</p>;

      case 'requests':
        return data.feedback_requests.length > 0 ? data.feedback_requests.map(req => (
          <div key={req.id} className="data-list-item">
            <div className="item-avatar orange">{req.recipient.full_name.charAt(0)}</div>
            <div className="item-content">
              <strong>{req.recipient.full_name}</strong>
              <span>Requested on {new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            <div className="item-action">
              <button className="button button-primary button-small" onClick={() => handleOpenModal(req)}>
                Fulfill Request
              </button>
            </div>
          </div>
        )) : <p className="empty-state">No pending requests. Great job!</p>;

      case 'peer':
        // Check if peer_feedback exists before mapping
        if (!data.peer_feedback || data.peer_feedback.length === 0) {
          return <p className="empty-state">The peer feedback queue is empty.</p>;
        }
        return data.peer_feedback.map(pf => {
          // --- DEBUGGING STEP ---
          // This will print each peer feedback object to the console, showing its exact structure.
          console.log("Rendering Peer Feedback Item:", pf);

          return (
            <div key={pf.id} className="data-list-item">
              <div className="item-avatar purple">
                {/* --- FIX: This correctly accesses the nested full_name --- */}
                {pf.target_employee?.full_name?.charAt(0) || '?'}
              </div>
              <div className="item-content">
                {/* --- FIX: This correctly accesses the nested full_name --- */}
                <strong>For: {pf.target_employee?.full_name || 'Unknown Employee'}</strong>
                <span className="peer-feedback-text">
                  "{(pf.strengths ?? '').substring(0, 80)}{(pf.strengths?.length ?? 0) > 80 ? '...' : ''}"
                </span>
              </div>
              <div className="item-action">
                <span>From: {pf.submitter?.full_name || 'Anonymous'}</span>
              </div>
            </div>
          );
        });
      
      default: return null;
    }
  };

  return (
    <div className="dashboard-panel">
      <aside className="dashboard-sidebar">
        <div>
          <div className="sidebar-logo">FeedbackTool</div>
          <nav className="sidebar-nav">
            <Link to="/manager/dashboard" className="sidebar-link active">Team Dashboard</Link>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-link logout-button">Log Out</button>
        </div>
      </aside>

      <main className="dashboard-content">
        <header className="content-header">
          <div>
            <h1>Welcome, {user.full_name.split(' ')[0]}</h1>
            <p className="header-subtitle">Here's a summary of your team's feedback activity.</p>
          </div>
        </header>
        
        <div className="dashboard-overview-grid">
            <StatsGrid data={data} />
            {data.sentiment_trends && <SentimentChart trends={data.sentiment_trends} />}
        </div>
        
        <nav className="content-tabs">
          <button className={`tab-button ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>My Team</button>
          <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Feedback History</button>
          <button className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Requests</button>
          <button className={`tab-button ${activeTab === 'peer' ? 'active' : ''}`} onClick={() => setActiveTab('peer')}>Peer Feedback</button>
        </nav>

        <div className="content-card data-list">
          {renderContent()}
        </div>
      </main>

      {isModalOpen && (
        <FeedbackFormModal 
          isOpen={isModalOpen} 
          onRequestClose={handleModalClose} 
          feedbackData={selectedFeedback} 
          teamMembers={data.team_members} 
        />
      )}
    </div>
  );
};

export default ManagerDashboard;