// src/components/CommentSection.js
import React, { useState } from 'react';
import api from '../services/api';

// Import the styles
import './CommentSection.css'; 

const CommentSection = ({ feedbackId, initialComments, onCommentsUpdate, currentUser }) => {
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await api.post(`/feedback/${feedbackId}/comments`, {
        text: newComment,
      });

      // The raw data from the API (e.g., { id: 1, text: '...', author_id: 5 })
      const rawNewComment = response.data;

      // --- FIX: NORMALIZE THE API RESPONSE ---
      // Create a new comment object that matches the structure your JSX expects.
      // This prevents rendering errors like "Cannot read properties of undefined (reading 'full_name')".
      const normalizedComment = {
        id: rawNewComment.id,
        created_at: rawNewComment.created_at,
        body: rawNewComment.text, // Map the API's 'text' field to the JSX's 'body' field
        author: {
          // The API response for a new comment likely doesn't include the author's name,
          // so we use the `currentUser` prop passed from the parent.
          full_name: currentUser ? currentUser.full_name : 'You',
        },
      };

      // Create the new list using the *normalized* comment object
      const updatedComments = [...comments, normalizedComment];

      // Update local state to show the new comment instantly
      setComments(updatedComments);
      
      // Notify the parent component with the correctly structured list
      if (onCommentsUpdate) {
        onCommentsUpdate(updatedComments);
      }

      setNewComment('');

    } catch (err) {
      setError('Could not post comment. Please try again.');
      console.error('Failed to post comment:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment">
            {/* This JSX will now work for both old and new comments */}
            <div className="comment-avatar">
              {comment.author && comment.author.full_name ? comment.author.full_name.charAt(0) : '?'}
            </div>
            <div className="comment-content">
              <div>
                <span className="comment-author">
                  {comment.author ? comment.author.full_name : 'Unknown Author'}
                </span>
                <span className="comment-date">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              {/* --- FIX: RENDER FROM `comment.body` --- */}
              {/* We normalized the new comment to have a `body` property, so this works */}
              <p className="comment-text">{comment.body}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          required
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
      {error && <p className="comment-error-message">{error}</p>}
    </div>
  );
};

export default CommentSection;