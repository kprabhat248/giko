import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Select from 'react-select/creatable';
import api from '../services/api';

import './FeedbackFormModal.css';
import NegativeIcon from '../icons/sentiments/NegativeIcon';
import NeutralIcon from '../icons/sentiments/NeutralIcon';
import PositiveIcon from '../icons/sentiments/PositiveIcon';

Modal.setAppElement('#root');

const customSelectStyles = {
  // ... your custom styles object (no changes needed)
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    border: state.isFocused ? '1px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    color: '#1a202c',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#e73b7d' : (state.isFocused ? 'rgba(255, 255, 255, 0.5)' : 'transparent'),
    color: state.isSelected ? 'white' : '#1a202c',
    fontWeight: 500,
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#1a202c',
    fontWeight: 500,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#4a5568',
  }),
  input: (provided) => ({
    ...provided,
    color: '#1a202c',
  }),
};


const FeedbackFormModal = ({ isOpen, onRequestClose, feedbackData, teamMembers }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    strengths: '',
    areas_to_improve: '',
    sentiment: 'neutral',
    tag_names: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const isUpdating = feedbackData && feedbackData.id;

  useEffect(() => {
    if (isOpen) {
        setFormData({
            employee_id: feedbackData?.employee_id || '',
            strengths: feedbackData?.strengths || '',
            areas_to_improve: feedbackData?.areas_to_improve || '',
            sentiment: feedbackData?.sentiment || 'neutral',
            tag_names: (feedbackData?.tags || []).map(t => ({ value: t.name, label: t.name }))
        });
        setError('');
    }
  }, [isOpen, feedbackData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSentimentChange = (newSentiment) => {
    setFormData(prev => ({ ...prev, sentiment: newSentiment }));
  };

  const handleTagChange = (selectedOptions) => {
    setFormData(prev => ({ ...prev, tag_names: selectedOptions || [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    if (!isUpdating && !formData.employee_id) {
        setError('Please select a team member.');
        setSubmitting(false);
        return;
    }
    
    const payload = {
      ...formData,
      tag_names: formData.tag_names.map(t => t.value)
    };

    try {
      if (isUpdating) {
        await api.put(`/manager/feedback/${feedbackData.id}`, payload);
      } else {
        await api.post('/manager/feedback', payload);
      }
      onRequestClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const employeeName = teamMembers.find(tm => tm.id === parseInt(formData.employee_id, 10))?.full_name || 'your team member';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="modal-glass-content"
      overlayClassName="modal-backdrop"
      closeTimeoutMS={300}
    >
      <div className="modal-form-wrapper">
        <h2 className="modal-form-title">{isUpdating ? 'Edit Feedback' : 'Give Feedback'}</h2>
        <p className="modal-form-subtitle">
            {isUpdating ? `Editing feedback for ${employeeName}.` : `Let a team member know how they're doing.`}
        </p>
        
        <form onSubmit={handleSubmit}>
          {!isUpdating && (
            <div className="form-section">
                <label className="form-section-label">For which team member?</label>
                <div className="input-group">
                    <select 
                        name="employee_id" 
                        value={formData.employee_id} 
                        onChange={handleChange}
                        className="native-select"
                        required
                    >
                        <option value="" disabled>Select an employee...</option>
                        {teamMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.full_name}</option>
                        ))}
                    </select>
                </div>
            </div>
          )}
          
          <div className="form-section">
            <label className="form-section-label">What is your overall sentiment?</label>
            {/* --- FIX IS HERE: REPLACED COMMENT WITH ACTUAL JSX --- */}
            <div className="sentiment-picker">
              <button type="button" onClick={() => handleSentimentChange('negative')} className={`sentiment-button ${formData.sentiment === 'negative' ? 'selected' : ''}`}>
                <NegativeIcon />
                <span>Bad</span>
              </button>
              <button type="button" onClick={() => handleSentimentChange('neutral')} className={`sentiment-button ${formData.sentiment === 'neutral' ? 'selected' : ''}`}>
                <NeutralIcon />
                <span>Okay</span>
              </button>
              <button type="button" onClick={() => handleSentimentChange('positive')} className={`sentiment-button ${formData.sentiment === 'positive' ? 'selected' : ''}`}>
                <PositiveIcon />
                <span>Good</span>
              </button>
            </div>
          </div>

          <div className="form-section">
              <label className="form-section-label">What are the main reasons for your rating?</label>
              {/* --- FIX IS HERE: REPLACED COMMENT WITH ACTUAL JSX --- */}
              <div className="input-group">
                  <label>WHAT WENT WELL? (STRENGTHS)</label>
                  <textarea name="strengths" value={formData.strengths} onChange={handleChange} required />
              </div>
              <div className="input-group" style={{marginTop: '1.5rem'}}>
                  <label>WHAT COULD BE IMPROVED?</label>
                  <textarea name="areas_to_improve" value={formData.areas_to_improve} onChange={handleChange} required />
              </div>
          </div>

          <div className="form-section">
              <label className="form-section-label">Tags</label>
              <Select
                  isMulti
                  isClearable
                  value={formData.tag_names}
                  onChange={handleTagChange}
                  placeholder="e.g., Q3-Review, Leadership..."
                  styles={customSelectStyles}
              />
          </div>

          {error && <p className="error" style={{color: '#e53e3e', fontWeight: 500, marginBottom: '1rem'}}>{error}</p>}
          
          <div className="modal-actions">
            <button type="button" onClick={onRequestClose} className="button-cancel" disabled={submitting}>Cancel</button>
            <button type="submit" className="button-pink" disabled={submitting}>
              {submitting ? 'Submitting...' : (isUpdating ? 'Update Feedback' : 'Submit Feedback')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default FeedbackFormModal;