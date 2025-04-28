import React, { useState } from 'react';
import axios from 'axios';
import './ScrapedResults.css';

const ScrapedResults = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [rows, setRows] = useState([]);
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

  // 1) Fetch top 10 lines from CSV
  const fetchCsvHead = async () => {
    try {
      if (selectedPlatform === 'youtube') {
        const res = await axios.get('http://127.0.0.1:5001/get-csv-head', { params: { limit: 10 } });
        setRows(res.data);
      } else {
        const res = await axios.get('http://127.0.0.1:5001/get-reddit-csv-head', { params: { limit: 10 } });
        setRows(res.data);
      }
    } catch (err) {
      console.error('Error fetching CSV head:', err.message);
    }
  };

  // 2) Clear the table data
  const handleClear = () => {
    setRows([]);
  };

  // 3) Delete the CSV file on the server
  const handleDelete = async () => {
    try {
      await axios.delete('http://127.0.0.1:5001/delete-file', {
        params: { platform: selectedPlatform }
      });
      setRows([]);
      showAlert(`Deleted ${selectedPlatform} CSV file successfully!`);
    } catch (err) {
      console.error('Error deleting file:', err.message);
      showWAlert(`Error deleting file: ${err.message}`);
    }
  };

  return (
    <div className="scraped-results-container">
      {alertVisible && (
  <div className="custom-alert2">
    <span className="checkmark2">✓</span> {alertMsg}
  </div>
)}
{alertWVisible && (
  <div className="custom-alert21">
    <span className="checkmark21">✗</span> {alertWMsg}
  </div>
)}
      <h2 className="scraped-results-title">Scraped CSV</h2>

      <div className="scraped-options">
        <label htmlFor="platformSelect">Select Platform:</label>
        <select
          id="platformSelect"
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value)}
        > <option value="">-- Choose --</option>
          <option value="youtube">YouTube</option>
          <option value="reddit">Reddit</option>
        </select>
      </div>

      <div className="scraped-buttons">
        <button onClick={fetchCsvHead}>Fetch</button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleDelete}>Delete</button>
      </div>

      {rows.length === 0 ? (
        <p className="no-data">No data to display yet. Try fetching first!</p>
      ) : (
        <table className="scraped-results-table">
          <thead>
            <tr>
              {selectedPlatform === 'youtube' ? (
                <>
                  <th>video_id</th>
                  <th>author_name</th>
                  <th>comment</th>
                  <th>published_at</th>
                  <th>likes</th>
                  <th>reply_count</th>
                </>
              ) : (
                <>
                  <th>Post URL</th>
                  <th>Comment</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {selectedPlatform === 'youtube' ? (
                  <>
                    <td>{row.video_id}</td>
                    <td>{row.author_name}</td>
                    <td>{row.comment}</td>
                    <td>{row.published_at}</td>
                    <td>{row.likes}</td>
                    <td>{row.reply_count}</td>
                  </>
                ) : (
                  <>
                    <td>{row['Post URL']}</td>
                    <td>{row['Comment']}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ScrapedResults;
