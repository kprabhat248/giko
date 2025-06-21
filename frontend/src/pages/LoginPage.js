import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

// A simple SVG placeholder for the illustration
const TeamIllustration = () => (
  <svg width="100%" height="100%" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="none"/>
    <rect x="80" y="80" width="240" height="140" rx="20" fill="#7C73E6" stroke="#fff" strokeWidth="2"/>
    <rect x="100" y="110" width="120" height="10" rx="5" fill="rgba(255,255,255,0.5)"/>
    <rect x="100" y="130" width="180" height="10" rx="5" fill="rgba(255,255,255,0.5)"/>
    <path d="M 150 50 L 160 65 H 200 a 10 10 0 0 1 10 10 v 10 a 10 10 0 0 1 -10 10 H 170 a 10 10 0 0 1 -10 -10 v -25 z" fill="#fff" />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState('manager@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  if (authLoading) return <Spinner />;

  return (
    <div className="login-layout">
      {/* Left Branding Panel */}
      <div className="login-branding-panel">
        <div className="branding-logo">FeedbackTool</div>
        <div className="branding-tagline">A home for teamwork, where everyone comes together</div>
        <div className="branding-illustration">
          <TeamIllustration />
        </div>
        <div className="branding-support">
          Experiencing issues? <a href="mailto:support@example.com">Get assistance</a>
        </div>
      </div>
      
      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <h1>Login</h1>
          <p>We'll get you back to the app in just a minute.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="form-options">
              <div className="checkbox-group">
                <input type="checkbox" id="stay-logged-in" />
                <label htmlFor="stay-logged-in">Stay logged in</label>
              </div>
            </div>
            
            {error && <p className="error" style={{marginBottom: '1rem'}}>{error}</p>}

            <button type="submit" className="button-solid" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;