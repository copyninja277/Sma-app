import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import ForceGraph2D from 'react-force-graph-2d';
import './DataVisualization.css';

import html2canvas from 'html2canvas';





const COLORS = ['#00C49F', '#FFBB28', '#FF4D4F'];

const DataVisualization = () => {
  const [platform, setPlatform] = useState('');
  const [sentimentSummary, setSentimentSummary] = useState({});
  const [tfidf, setTfidf] = useState([]);
  const [topics, setTopics] = useState([]);
  const [wordcloudImg, setWordcloudImg] = useState('');
  const [network, setNetwork] = useState({ nodes: [], links: [] });
  const [centralities, setCentralities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cooccurrenceImg, setCooccurrenceImg] = useState('');
  const [analysisReady, setAnalysisReady] = useState(false);

  const tfidfRef = useRef(null);
const sentimentRef = useRef(null);
const topicRef = useRef(null);

const [tfidfImg, setTfidfImg] = useState('');
const [sentimentImg, setSentimentImg] = useState('');
const [topicImg, setTopicImg] = useState('');
  const handleDisplay = () => {
    if (!platform) return alert('Please select a platform first.');

    setLoading(true);
    axios.post('http://localhost:5002/analyze', { platform })
      .then(res => {
        const net = res.data.network || { nodes: [], edges: [] };
        setSentimentSummary(res.data.sentiment_summary || {});
        setTfidf(res.data.tfidf || []);
        setTopics(res.data.topics || []);
        setWordcloudImg(res.data.wordcloud || '');
        setCooccurrenceImg(res.data.cooccurrence_img || '');
        setCentralities(res.data.centralities || []);
        setNetwork({
          nodes: net.nodes || [],
          links: net.edges || []
        });
        setAnalysisReady(true);
      })
      .catch(err => {
        console.error('Error fetching analysis:', err);
      })
      .finally(() => {setLoading(false)
        setTimeout(() => {
          if (tfidfRef.current) {
            html2canvas(tfidfRef.current).then(canvas => {
              setTfidfImg(canvas.toDataURL('image/png'));
            });
          }
          if (sentimentRef.current) {
            html2canvas(sentimentRef.current).then(canvas => {
              setSentimentImg(canvas.toDataURL('image/png'));
            });
          }
          if (topicRef.current) {
            html2canvas(topicRef.current).then(canvas => {
              setTopicImg(canvas.toDataURL('image/png'));
            });
          }
        }, 1000);  // Give time to render
        
      });
  };

  const handleDownloadReport = () => {
    const html = `
      <html>
      <head><meta charset="utf-8"><title>Report</title></head>
      <body>
        <h1>Social Media Analysis Report</h1>
        <h2>Platform: ${platform}</h2>
  
        <h3>Sentiment Summary:</h3>
        <ul>
          ${Object.entries(sentimentSummary).map(([k, v]) => `<li>${k}: ${v}</li>`).join('')}
        </ul>
  
        ${sentimentImg ? `<h3>Sentiment Chart:</h3><img src="${sentimentImg}" style="max-width:100%; height:auto;" />` : ''}
  
        <h3>Top TF-IDF Terms:</h3>
        <ul>
          ${tfidf.map(([term, score]) => `<li>${term}: ${score.toFixed(3)}</li>`).join('')}
        </ul>
  
        ${tfidfImg ? `<h3>TF-IDF Chart:</h3><img src="${tfidfImg}" style="max-width:100%; height:auto;" />` : ''}
  
        <h3>Topics Discovered:</h3>
        <ul>
          ${topics.map((topic, i) => `<li>Topic ${i + 1}: ${topic.join(', ')}</li>`).join('')}
        </ul>
  
        ${topicImg ? `<h3>Topic Chart:</h3><img src="${topicImg}" style="max-width:100%; height:auto;" />` : ''}
  
        ${wordcloudImg ? `<h3>Word Cloud:</h3><img src="data:image/png;base64,${wordcloudImg}" style="max-width:100%; height:auto;" />` : ''}
        ${cooccurrenceImg ? `<h3>Word Co-occurrence Network:</h3><img src="data:image/png;base64,${cooccurrenceImg}" style="max-width:100%; height:auto;" />` : ''}
      </body>
      </html>
    `;
  
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SocialMediaAnalysis_Report.doc';
    a.click();
    URL.revokeObjectURL(url);
  };
  

  const sentimentPieData = Object.entries(sentimentSummary).map(([label, count]) => ({
    name: label,
    value: count
  }));

  const tfidfBarData = tfidf.map(([term, score]) => ({
    term,
    score: parseFloat(score.toFixed(3))
  }));

  const topicBarData = topics.flatMap((words, topicIndex) =>
    words.map((word, wordIndex) => ({
      topic: `Topic ${topicIndex + 1}`,
      word,
      score: words.length - wordIndex
    }))
  );

  return (
    <div className="data-vis-container">
      <h1 className="data-vis-title">Data Visualizations</h1>

      <div className="platform-select">
        <label>Select Platform:</label>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="">-- Choose --</option>
          <option value="youtube">YouTube</option>
          <option value="reddit">Reddit</option>
        </select>
        <button onClick={handleDisplay}>Display</button>
      </div>

      {loading ? (
        <p className="loading-text">Loading visualizations...</p>
      ) : (
        <>
          {/* Row 1 */}
          <div className="vis-row">
            {sentimentPieData.length > 0 && (
              <div className="vis-box"ref={sentimentRef}>
                <h2>Sentiment Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sentimentPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {sentimentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {tfidfBarData.length > 0 && (
              <div className="vis-box"ref={tfidfRef}>
                <h2>Top TF-IDF Terms</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tfidfBarData}>
                    <XAxis dataKey="term" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Row 2 */}
<div className="vis-row">
  {topicBarData.length > 0 && (
    <div className="vis-box"ref={topicRef}>
      <h2>Topic Modeling</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topicBarData}>
          <XAxis dataKey="word" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="score" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}

  {cooccurrenceImg && (
    <div className="vis-box">
      <h2>Word Co-occurrence Graph</h2>
      <img
        src={`data:image/png;base64,${cooccurrenceImg}`}
        alt="Co-occurrence Graph"
        className="max-w-full h-auto"
        style={{ maxHeight: 400 }}
      />
    </div>
  )}
</div>

          {/* Row 3 - Word Cloud */}
          {wordcloudImg && (
            <div className="vis-box centered-box">
              <h2>Word Cloud</h2>
              <img
                src={`data:image/png;base64,${wordcloudImg}`}
                alt="Word Cloud"
                className="max-w-full h-auto"
                style={{ maxHeight: 400 }}
              />
            </div>
          )}

{analysisReady && (
        <>
          {/* Visualization grid... (your existing 3 rows, 5 containers logic) */}

          {/* Download button */} 
          <div style={{ marginTop: '2rem' }}>
              <button className="download-btn2" onClick={handleDownloadReport}>
              Download Visualization Report
              </button>
            </div>
        </>
      )}
        </>
      )}
    </div>
  );
};

export default DataVisualization;
