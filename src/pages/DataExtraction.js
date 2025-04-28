import React, { useState } from 'react';
import axios from 'axios';
import './DataExtraction.css';

const DataExtraction = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('');

  // YouTube states
  const [videoIds, setVideoIds] = useState('');
  const [ytQuery, setYtQuery] = useState('');
  const [commentLimit, setCommentLimit] = useState('100');
  const [searchLimit, setSearchLimit] = useState('5');

  // Reddit states
  const [redditQuery, setRedditQuery] = useState('');
  const [redditCommentLimit, setRedditCommentLimit] = useState('300');
  const [redditSearchLimit, setRedditSearchLimit] = useState('100');

  // Loading / Scraping States
  const [isScraping, setIsScraping] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
const [alertVisible, setAlertVisible] = useState(false);
const [alertWMsg, setAlertWMsg] = useState('');
const [alertWVisible, setAlertWVisible] = useState(false);

const showAlert = (message) => {
  setAlertMsg(message);
  setAlertVisible(true);
  setTimeout(() => setAlertVisible(false), 3000); // Auto-dismiss in 3s
};
const showWAlert = (message) => {
  setAlertWMsg(message);
  setAlertWVisible(true);
  setTimeout(() => setAlertWVisible(false), 3000); // Auto-dismiss in 3s
};


  const handlePlatformChange = (e) => {
    setSelectedPlatform(e.target.value);
  };

  const handleScrape = async () => {
    if (!selectedPlatform) {
      showWAlert(`Please select a platform first.`);
      return;
    }

    // Disable button, set loading
    setIsScraping(true);

    try {
      let response;
      if (selectedPlatform === 'youtube') {
        response = await axios.get('http://127.0.0.1:5001/scrape-comments', {
          params: {
            video_ids: videoIds,
            query: ytQuery,
            comment_limit: commentLimit,
            search_limit: searchLimit,
          },
        });
        showAlert(`YouTube scrape success: ${response.data.message}`);

      } else if (selectedPlatform === 'reddit') {
        response = await axios.get('http://127.0.0.1:5001/scrape-reddit', {
          params: {
            query: redditQuery,
            comment_limit: redditCommentLimit,
            search_limit: redditSearchLimit,
          },
        });
        showAlert(`Reddit scrape success: ${response.data.message}`);

      }
    } catch (err) {
      showWAlert(`Error scraping ${selectedPlatform}: ${err.message}`);

    } finally {
      // Re-enable button
      setIsScraping(false);
    }
  };

  return (
    <div className="data-extraction-container">
      {alertVisible && (
  <div className="custom-alert">
    <span className="checkmark">✓</span> {alertMsg}
  </div>
)}
{alertWVisible && (
  <div className="custom-alert22">
    <span className="checkmark22">✗</span> {alertWMsg}
  </div>
)}

      <h2>Data Extraction</h2>

      <div className="platform-selection">
        <label>
          <input
            type="radio"
            value="youtube"
            checked={selectedPlatform === 'youtube'}
            onChange={handlePlatformChange}
          />
          YouTube
        </label>
        <label>
          <input
            type="radio"
            value="reddit"
            checked={selectedPlatform === 'reddit'}
            onChange={handlePlatformChange}
          />
          Reddit
        </label>
      </div>

      {selectedPlatform === 'youtube' && (
        <div>
          <div className="form-group">
            <label>Video IDs:</label>
            <input
              type="text"
              value={videoIds}
              onChange={(e) => setVideoIds(e.target.value)}
              placeholder="e.g. gQc58vGHlvs,p4ldj_c8yIQ"
            />
          </div>
          <div className="form-group">
            <label>Query (optional):</label>
            <input
              type="text"
              value={ytQuery}
              onChange={(e) => setYtQuery(e.target.value)}
              placeholder="Type your query here"
            />
          </div>
          <div className="form-group">
            <label>Comment Limit:</label>
            <input
              type="number"
              value={commentLimit}
              onChange={(e) => setCommentLimit(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Search Limit:</label>
            <input
              type="number"
              value={searchLimit}
              onChange={(e) => setSearchLimit(e.target.value)}
            />
          </div>
        </div>
      )}

      {selectedPlatform === 'reddit' && (
        <div>
          <div className="form-group">
            <label>Search Query:</label>
            <input
              type="text"
              value={redditQuery}
              onChange={(e) => setRedditQuery(e.target.value)}
              placeholder="Type your query here"
            />
          </div>
          <div className="form-group">
            <label>Comment Limit:</label>
            <input
              type="number"
              value={redditCommentLimit}
              onChange={(e) => setRedditCommentLimit(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Search Limit:</label>
            <input
              type="number"
              value={redditSearchLimit}
              onChange={(e) => setRedditSearchLimit(e.target.value)}
            />
          </div>
        </div>
      )}

{selectedPlatform && (
  <div className="buttons">
    <button onClick={handleScrape} disabled={isScraping}>
      {isScraping ? 'Scraping...' : 'Scrape'}
    </button>
  </div>
)}
    </div>
  );
};

export default DataExtraction;
