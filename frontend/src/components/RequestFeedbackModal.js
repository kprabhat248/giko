import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import api from '../services/api';

// Import the CSS for our glass modals. We can reuse styles!
import './FeedbackFormModal.css'; // Reusing the styles from the other modal
import './RequestFeedbackModal.css'; // Adding specific styles for this one

// --- Self-contained SVG Icons for this Component ---

const PaperPlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2z" />
  </svg>
);

const SuccessIcon = () => (
  <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle className="success-icon-circle" cx="26" cy="26" r="25" fill="none"/>
    <path className="success-icon-checkmark" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
  </svg>
);


const RequestFeedbackModal = ({ isOpen, onRequestClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Add a short delay to allow the closing animation to finish
      setTimeout(() => {
        setSuccess(false);
        setError('');
        setSubmitting(false);
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      await api.post('/employee/request-feedback');
      setSuccess(true);
    } catch (err) {
      setError('Failed to send request. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal-glass-content" // Reusing our beautiful glass style
      overlayClassName="modal-backdrop" // Reusing the dark backdrop
      closeTimeoutMS={300}
    >
      <div className="modal-form-wrapper">
        {success ? (
          <div className="success-state-content">
            <SuccessIcon />
            <h3 className="success-title">Request Sent!</h3>
            <p className="success-text">
              Your manager has been notified. You'll see their feedback here once they respond.
            </p>
            <button onClick={onRequestClose} className="button-pink">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="modal-title-icon">
              <PaperPlaneIcon />
              <span>Request Feedback</span>
            </h2>
            <p className="confirmation-text">
              This will send a notification to your manager asking them to provide you with feedback. Are you sure you want to proceed?
            </p>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="modal-actions">
              <button onClick={onRequestClose} className="button-cancel">
                Cancel
              </button>
              <button onClick={handleSubmit} className="button-pink" disabled={submitting}>
                {submitting ? 'Sending...' : 'Yes, Send Request'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default RequestFeedbackModal;