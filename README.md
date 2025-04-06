# Social Media Analysis App

A full-stack application for extracting, analyzing, and visualizing YouTube and Reddit comment datasets. This project uses **Flask (Python)** for the backend and **React.js** for the frontend, enabling users to:

- Scrape YouTube or Reddit data via API
- Perform sentiment analysis
- Generate TF-IDF scores
- Discover latent topics (via LDA)
- Visualize word co-occurrence networks
- Display word clouds and various charts

---

## Project Structure

```
├── backend/
│   ├── mainfl.py             # Flask API to scrape data from YouTube & Reddit
│   ├── analysis.py           # Flask API for NLP analysis
│   ├── youtube-comments.csv  # Sample YouTube data
│   └── reddit_comments.csv   # Sample Reddit data
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Homepage.js           # Landing page with navigation
│   │   │   ├── DataExtraction.js     # UI to trigger YouTube/Reddit scraping
│   │   │   ├── ScrapedResults.js     # Shows scraped results before analysis
│   │   │   ├── DataAnalysis.js       # Shows sentiment scores, TF-IDF, topics, centrality
│   │   │   └── DataVisualization.js  # Visual charts, word cloud, network graph
│   │   └── App.js
│   ├── public/
│   └── package.json
```

---

## Features

* **Data Extraction (mainfl.py)**
  - `POST /scrape/youtube` → Fetch comments using a video ID
  - `POST /scrape/reddit` → Fetch comments from a Reddit post or subreddit
  - Saves output as CSV used by `analysis.py`

* **Backend NLP (analysis.py)**
  - Detects platform and loads appropriate CSV
  - Cleans and extracts the `text` column
  - Performs:
    - Sentiment analysis (TextBlob)
    - TF-IDF score extraction
    - LDA Topic Modeling
    - Word Co-occurrence network graph
    - Degree centrality
    - Word Cloud (base64 PNG)

* **Frontend (React)**
  - `Homepage.js`: Navigation to extraction and analysis
  - `DataExtraction.js`: Trigger scraping APIs for YouTube/Reddit
  - `ScrapedResults.js`: Shows preview of scraped data
  - `DataAnalysis.js`: Shows sentiment, TF-IDF, topics, centrality
  - `DataVisualization.js`: Renders pie charts, word cloud, network graph

---

## Setup Instructions

### Requirements

- Python 3.8 or higher
- Node.js v18 or higher

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python mainfl.py  # Run scraping server
python analysis.py  # Run analysis server (port 5002)
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## API Configuration

### YouTube API Setup:

1. Go to https://console.developers.google.com
2. Create a new project and enable the **YouTube Data API v3**
3. Generate an API key under **Credentials**
4. Replace the placeholder in `mainfl.py`:
   ```python
   API_KEY = "YOUR_YOUTUBE_API_KEY"
   ```

### Reddit API Setup:

1. Visit https://www.reddit.com/prefs/apps
2. Click **create an app**:
   - Name: Your app name
   - Type: Script
   - Redirect URI: http://localhost:8080
3. Note down your **client ID** and **secret**
4. Replace them in `mainfl.py`:
   ```python
   CLIENT_ID = "YOUR_CLIENT_ID"
   CLIENT_SECRET = "YOUR_CLIENT_SECRET"
   USER_AGENT = "YOUR_USER_AGENT"
   ```

---

## Sample Endpoints

* From `mainfl.py`
  - `POST /scrape/youtube` with `{ video_id: "abc123" }`
  - `POST /scrape/reddit` with `{ subreddit: "askreddit" }`

* From `analysis.py`
  - `POST /analyze` with `{ platform: "youtube" | "reddit" }`
  - Response JSON includes:
    - `sentiments`, `sentiment_summary`
    - `tfidf`, `topics`, `centralities`
    - `network.nodes`, `network.edges`
    - `wordcloud` (base64 PNG)

---

## Dependencies

### Backend

- Flask
- Flask-CORS
- pandas
- scikit-learn
- textblob
- networkx
- wordcloud
- matplotlib

### Frontend

- React.js
- Axios
- Recharts
- react-force-graph-2d
- html2canvas (for generating images for report)

---

## Notes

- Ensure your dataset includes a valid text column such as `text`, `comment`, `body`, or `message`
- Word cloud and co-occurrence graph images are generated server-side and served as base64
- Report generation in `.doc` format includes charts and insights

---

## License

This project is for educational and experimental purposes.

---

## Author

Built by Gunjan Kadam, Kapil Bhatia, Dakshita Kolte powered by Flask, React