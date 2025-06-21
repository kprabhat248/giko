import React, { useState, useEffect } from 'react'; // <-- Make sure useEffect is imported
import ReactMarkdown from 'react-markdown';
import { downloadFeedbackPDF } from '../services/api';
import CommentSection from './CommentSection';
import './FeedbackCard.css';

const CommentIcon = () => '💬';
const DownloadIcon = () => '📄';

const FeedbackCard = ({ feedback, onAcknowledge }) => {
  const [currentFeedback, setCurrentFeedback] = useState(feedback);
  const [showComments, setShowComments] = useState(false);

  // --- THE FIX: Add this useEffect hook ---
  // This hook will run whenever the 'feedback' prop changes.
  useEffect(() => {
    // When the parent sends down a new version of the feedback prop
    // (e.g., after acknowledging), update our internal state to match.
    setCurrentFeedback(feedback);
  }, [feedback]); // The dependency array ensures this runs only when 'feedback' prop changes

  const handleCommentsUpdate = (updatedComments) => {
    const updatedFeedback = {
      ...currentFeedback,
      comments: updatedComments,
    };
    setCurrentFeedback(updatedFeedback);
  };

  // The rest of your component logic remains the same.
  // It correctly uses `currentFeedback` for rendering.
  return (
    <div className={`feedback-card ${currentFeedback.is_acknowledged ? 'acknowledged' : ''}`}>
      <header className="feedback-card-header">
        {/* ... your header jsx ... */}
        <div className="author-info">
          <div className="author-avatar">{currentFeedback.author.full_name.charAt(0)}</div>
          <div className="author-details">
            <strong className="author-name">{currentFeedback.author.full_name}</strong>
            <span className="feedback-date">
              {new Date(currentFeedback.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <div className="feedback-tags">
          {currentFeedback.tags.map(tag => (
            <span key={tag.id} className="tag tag-blue">{tag.name}</span>
          ))}
        </div>
      </header>

      <div className="feedback-card-body">
        {/* ... your body jsx ... */}
        <div className="feedback-section">
          <h4>Strengths</h4>
          <ReactMarkdown>{currentFeedback.strengths || '_No strengths mentioned._'}</ReactMarkdown>
        </div>
        <div className="feedback-section">
          <h4>Areas to Improve</h4>
          <ReactMarkdown>{currentFeedback.areas_to_improve || '_No areas for improvement mentioned._'}</ReactMarkdown>
        </div>
      </div>
      
      <footer className="feedback-card-footer">
        {/* ... your footer jsx ... */}
        <button className="meta-button" onClick={() => setShowComments(!showComments)}>
          <CommentIcon /> {currentFeedback.comments.length} Comments
        </button>
        <button className="meta-button" onClick={() => downloadFeedbackPDF(currentFeedback.id)}>
          <DownloadIcon /> Download PDF
        </button>
      </footer>
      
      {showComments && (
        <div className="comment-section-wrapper">
          <CommentSection
            feedbackId={currentFeedback.id}
            initialComments={currentFeedback.comments}
            onCommentsUpdate={handleCommentsUpdate}
          />
        </div>
      )}

      {/* This section will now work perfectly */}
      <div className="acknowledge-container">
        <button
          className="acknowledge-button"
          onClick={() => onAcknowledge(currentFeedback.id)}
          disabled={currentFeedback.is_acknowledged}
        >
          {currentFeedback.is_acknowledged ? '✓ Acknowledged' : 'Acknowledge Feedback'}
        </button>
      </div>
    </div>
  );
};

export default FeedbackCard;