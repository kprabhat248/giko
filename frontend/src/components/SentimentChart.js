import React from 'react';
import './SentimentChart.css'; // We'll add this CSS next

const SentimentChart = ({ trends }) => {
  const total = trends.positive + trends.neutral + trends.negative;
  if (total === 0) {
    return (
      <div className="sentiment-chart-card">
        <h4>Sentiment Trends</h4>
        <p className="empty-state">No feedback data available yet.</p>
      </div>
    );
  }

  const getPercentage = (value) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div className="sentiment-chart-card">
      <h4>Sentiment Trends</h4>
      <div className="sentiment-bar">
        <div 
          className="bar-segment positive" 
          style={{ flexBasis: `${getPercentage(trends.positive)}%` }}
          title={`Positive: ${trends.positive}`}
        />
        <div 
          className="bar-segment neutral" 
          style={{ flexBasis: `${getPercentage(trends.neutral)}%` }}
          title={`Neutral: ${trends.neutral}`}
        />
        <div 
          className="bar-segment negative" 
          style={{ flexBasis: `${getPercentage(trends.negative)}%` }}
          title={`Negative: ${trends.negative}`}
        />
      </div>
      <div className="sentiment-legend">
        <div className="legend-item"><span className="dot positive"></span>Positive ({trends.positive})</div>
        <div className="legend-item"><span className="dot neutral"></span>Neutral ({trends.neutral})</div>
        <div className="legend-item"><span className="dot negative"></span>Negative ({trends.negative})</div>
      </div>
    </div>
  );
};

export default SentimentChart;