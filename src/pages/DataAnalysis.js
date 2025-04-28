import React, { useState } from 'react';
import axios from 'axios';
import './DataAnalysis.css';

const DataAnalysis = () => {
  const [platform, setPlatform] = useState('');
  const [sentiments, setSentiments] = useState([]);
  const [sentimentSummary, setSentimentSummary] = useState({});
  const [topics, setTopics] = useState([]);
  const [tfidf, setTfidf] = useState([]);
  const [centralities, setCentralities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  
  const showAlert = (message) => {
    setAlertMsg(message);
    setAlertVisible(true);
    setTimeout(() => setAlertVisible(false), 3000); // Auto-dismiss in 3s
  };

  const handleAnalyze = () => {
    if (!platform) return showAlert('Please select a platform first.');
  
    setLoading(true);
    axios
      .post('http://localhost:5002/analyze', { platform })
      .then((res) => {
        setSentiments(res.data.sentiments || []);
        setSentimentSummary(res.data.sentiment_summary || {});
        setTopics(res.data.topics || []);
        setTfidf(res.data.tfidf || []);
        setCentralities(res.data.centralities || []);
      })
      .catch((err) => {
        console.error(err);
        showAlert('Error fetching analysis: No data found!');
      })
      .finally(() => setLoading(false));
  };
  

  const averageSentiment = sentiments.length
    ? (sentiments.reduce((a, b) => a + b, 0) / sentiments.length).toFixed(3)
    : 'N/A';

  const handleDownloadCSV = () => {
    const csvData = [];

    csvData.push(['Section', 'Key', 'Value']);

    // Sentiment Summary
    csvData.push(['Sentiment Summary', 'Average Sentiment', averageSentiment]);
    Object.entries(sentimentSummary).forEach(([key, val]) =>
      csvData.push(['Sentiment Summary', key, val])
    );

    // TF-IDF
    tfidf.forEach(([term, score]) =>
      csvData.push(['TF-IDF', term, score.toFixed(3)])
    );

    // Topics
    topics.forEach((topicWords, idx) =>
      csvData.push(['Topic ' + (idx + 1), 'Words', topicWords.join(', ')])
    );

    // Centralities
    centralities.forEach(([word, score]) =>
      csvData.push(['Centrality', word, score.toFixed(3)])
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvData.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${platform}_analysis_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="data-analysis-container">
        {alertVisible && (
  <div className="custom-alert3">
    <span className="checkmark3">✗</span> {alertMsg}
  </div>
)}
      <h1>Data Analysis</h1>

      <div className="data-analysis-form">
        <label>Select Platform:</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">-- Choose --</option>
          <option value="youtube">YouTube</option>
          <option value="reddit">Reddit</option>
        </select>
        <button onClick={handleAnalyze}>Analyze</button>
      </div>

      {loading ? (
        <p className="loading-text">Loading analysis...</p>
      ) : (
        <>
          {/* Sentiment */}
          {sentiments.length > 0 && (
            <div className="section">
              <h2>Sentiment Summary</h2>
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Average Sentiment</td>
                    <td>{averageSentiment}</td>
                  </tr>
                  <tr>
                    <td>Positive</td>
                    <td>{sentimentSummary.positive || 0}</td>
                  </tr>
                  <tr>
                    <td>Neutral</td>
                    <td>{sentimentSummary.neutral || 0}</td>
                  </tr>
                  <tr>
                    <td>Negative</td>
                    <td>{sentimentSummary.negative || 0}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TF-IDF */}
          {tfidf.length > 0 && (
            <div className="section">
              <h2>Top TF-IDF Terms</h2>
              <table>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {tfidf.map(([term, score], idx) => (
                    <tr key={idx}>
                      <td>{term}</td>
                      <td>{score.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="section">
              <h2>Topics Discovered</h2>
              <table>
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Top Words</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((topic, idx) => (
                    <tr key={idx}>
                      <td>Topic {idx + 1}</td>
                      <td>{topic.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Centrality */}
          {centralities.length > 0 && (
            <div className="section">
              <h2>Top Central Words</h2>
              <table>
                <thead>
                  <tr>
                    <th>Word</th>
                    <th>Centrality</th>
                  </tr>
                </thead>
                <tbody>
                  {centralities.map(([word, score], idx) => (
                    <tr key={idx}>
                      <td>{word}</td>
                      <td>{score.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Download Button */}
          {(sentiments.length || tfidf.length || topics.length || centralities.length) > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <button className="download-btn" onClick={handleDownloadCSV}>
                Download Analysis Report
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataAnalysis;
