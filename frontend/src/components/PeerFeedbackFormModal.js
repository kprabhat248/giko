import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from '../services/api';

// Assuming you have these CSS classes defined from your other modal
import './FeedbackFormModal.css'; 

Modal.setAppElement('#root');

const PeerFeedbackFormModal = ({ isOpen, onRequestClose, teammates }) => {
  // --- FIX #1: Default state for isAnonymous is now 'false' ---
  const [isAnonymous, setIsAnonymous] = useState(false);
  // --- END FIX #1 ---
  
  const [targetId, setTargetId] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasToImprove, setAreasToImprove] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset the form state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetId('');
      setStrengths('');
      setAreasToImprove('');
      // --- FIX #2: Reset isAnonymous to 'false' as well ---
      setIsAnonymous(false); 
      // --- END FIX #2 ---
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    const payload = {
      target_employee_id: parseInt(targetId, 10),
      strengths: strengths,
      areas_to_improve: areasToImprove,
      is_anonymous: isAnonymous // This now correctly reflects the user's choice
    };

    try {
      await api.post('/employee/peer-feedback', payload);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to submit peer feedback. Please check your inputs.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal-glass-content"
      overlayClassName="modal-backdrop"
      closeTimeoutMS={200}
    >
      <div className="modal-form-wrapper">
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <h2 className="modal-form-title">Thank You!</h2>
            <p className="modal-form-subtitle" style={{marginBottom: '2rem'}}>Your feedback has been sent to your manager for review.</p>
            <button onClick={onRequestClose} className="button-pink">Close</button>
          </div>
        ) : (
          <>
            <h2 className="modal-form-title">Give Peer Feedback</h2>
            <p className="modal-form-subtitle">Your feedback will be visible only to your manager.</p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <div className="input-group">
                  <label htmlFor="teammate-select">TEAMMATE</label>
                  <select id="teammate-select" value={targetId} onChange={e => setTargetId(e.target.value)} className="native-select" required>
                      <option value="" disabled>Select a teammate</option>
                      {teammates.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <div className="input-group">
                  <label htmlFor="peer-strengths">WHAT WENT WELL? (STRENGTHS)</label>
                  <textarea 
                    id="peer-strengths" 
                    value={strengths} 
                    onChange={e => setStrengths(e.target.value)} 
                    placeholder="e.g., Great collaborator, excellent attention to detail..." 
                    rows={4}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-section">
                <div className="input-group">
                  <label htmlFor="peer-areas-to-improve">WHAT COULD BE IMPROVED?</label>
                  <textarea 
                    id="peer-areas-to-improve" 
                    value={areasToImprove} 
                    onChange={e => setAreasToImprove(e.target.value)} 
                    placeholder="e.g., Could be more vocal in team meetings..." 
                    rows={4}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-section">
                  <div className="modal-checkbox-group">
                      <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                      <label htmlFor="anonymous">Submit Anonymously</label>
                  </div>
              </div>

              {error && <p className="error" style={{color: '#e53e3e', fontWeight: 500, marginBottom: '1rem'}}>{error}</p>}
              
              <div className="modal-actions">
                <button type="button" onClick={onRequestClose} className="button-cancel">Cancel</button>
                <button type="submit" className="button-pink" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};

export default PeerFeedbackFormModal;