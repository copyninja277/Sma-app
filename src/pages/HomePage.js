import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <h2>Welcome to the Social Media Analysis App</h2>

      <div className="home-features">
        <div className="home-feature">
          <div className="home-feature-icon">✓</div>
          Scrape YouTube & Reddit data in one click
        </div>
        <div className="home-feature">
          <div className="home-feature-icon">✓</div>
          Visualize insights with sentiment, topics & TF-IDF
        </div>
        <div className="home-feature">
          <div className="home-feature-icon">✓</div>
          Interactive word cloud & network graphs
        </div>
      </div>
    </div>
  );
};

export default HomePage;
